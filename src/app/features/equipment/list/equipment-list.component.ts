import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime } from 'rxjs';
import { EquipmentService } from '../equipment.service';
import { Equipment } from '../../../core/models/client.model';
import { StateContainerComponent } from '../../../shared/components/state-container/state-container.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { UiState, errorState, extractErrorMessage, loadingState, successState } from '../../../shared/components/state-container/ui-state';
import { EquipmentFormDialogComponent } from '../form-dialog/equipment-form-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-equipment-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatTableModule, MatFormFieldModule, MatSelectModule,
    MatInputModule, MatButtonModule, MatIconModule, MatMenuModule, MatPaginatorModule,
    StateContainerComponent, PageHeaderComponent,
  ],
  templateUrl: './equipment-list.component.html',
})
export class EquipmentListComponent implements OnInit {
  @Input() siteId?: string; // present when nested under /app/sites/:siteId/equipment

  readonly displayedColumns = ['name', 'assetNumber', 'qrCode', 'manufacturerModel', 'status', 'actions'];
  readonly state = signal<UiState<Equipment[]>>(loadingState());
  readonly totalElements = signal(0);
  readonly pageSize = signal(10);
  readonly pageIndex = signal(0);

  readonly filterForm = this.fb.group({ search: [''], status: [''], qrCode: [''] });

  constructor(
    private readonly fb: FormBuilder,
    private readonly equipmentService: EquipmentService,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.load();
    this.filterForm.valueChanges.pipe(debounceTime(350)).subscribe(() => {
      this.pageIndex.set(0);
      this.load();
    });
  }

  load(): void {
    this.state.set(loadingState());
    const { search, status } = this.filterForm.getRawValue();
    this.equipmentService
      .list({
        search: search || undefined,
        status: status || undefined,
        siteId: this.siteId || undefined,
        page: this.pageIndex(),
        size: this.pageSize(),
        sort: 'name,asc',
      })
      .subscribe({
        next: (page) => {
          this.totalElements.set(page.totalElements);
          this.state.set(successState(page.content, page.content.length === 0));
        },
        error: (err) => this.state.set(errorState(extractErrorMessage(err))),
      });
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  searchByQr(): void {
    const qrCode = this.filterForm.controls.qrCode.value;
    if (!qrCode) return;
    this.state.set(loadingState());
    this.equipmentService.findByQrCode(qrCode).subscribe({
      next: (equipment) => this.state.set(successState([equipment], false)),
      error: (err) => this.state.set(errorState(extractErrorMessage(err))),
    });
  }

  openCreate(): void {
    const ref = this.dialog.open(EquipmentFormDialogComponent, { width: '640px', data: { siteId: this.siteId } });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('Equipamento criado com sucesso.', 'Fechar', { duration: 3000 });
        this.load();
      }
    });
  }

  openEdit(equipment: Equipment): void {
    const ref = this.dialog.open(EquipmentFormDialogComponent, { width: '640px', data: { equipment, siteId: this.siteId } });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('Equipamento atualizado com sucesso.', 'Fechar', { duration: 3000 });
        this.load();
      }
    });
  }

  changeStatus(equipment: Equipment, action: 'activate' | 'inactivate' | 'decommission'): void {
    const messages = {
      activate: { title: 'Ativar equipamento', message: `Ativar ${equipment.name}?` },
      inactivate: { title: 'Inativar equipamento', message: `Inativar ${equipment.name}?` },
      decommission: { title: 'Desativar permanentemente', message: `Marcar ${equipment.name} como desativado (fora de uso)?` },
    }[action];
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: { title: messages.title, message: messages.message, danger: action !== 'activate' },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.equipmentService[action](equipment.id).subscribe({
        next: () => {
          this.snackBar.open('Status atualizado.', 'Fechar', { duration: 3000 });
          this.load();
        },
        error: (err) => this.snackBar.open(extractErrorMessage(err), 'Fechar', { duration: 5000 }),
      });
    });
  }
}
