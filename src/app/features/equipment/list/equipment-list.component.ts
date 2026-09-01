import { Component, Input, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FoLabelPipe } from '../../../shared/pipes/fo-label.pipe';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime } from 'rxjs';
import { EquipmentService } from '../equipment.service';
import { SitesService } from '../../sites/sites.service';
import { ClientsService } from '../../clients/clients.service';
import { Client, Equipment, EquipmentStatus, InspectionSite } from '../../../core/models/client.model';
import { StateContainerComponent } from '../../../shared/components/state-container/state-container.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { UiState, errorState, extractErrorMessage, loadingState, successState } from '../../../shared/components/state-container/ui-state';
import { EquipmentFormDialogComponent } from '../form-dialog/equipment-form-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

/**
 * The real backend has no flat GET /equipment list — equipment is only listable nested
 * under a site (GET /sites/{siteId}/equipment), plus a by-QR-code lookup. When this
 * component isn't given a siteId via route input (the top-level "Equipamentos" screen),
 * it shows a client → site picker and lists that site's equipment, filtering client-side.
 * The QR-code search box works independently of the picker either way.
 */
@Component({
  selector: 'app-equipment-list',
  standalone: true,
  imports: [
    FoLabelPipe,
    CommonModule, ReactiveFormsModule, MatTableModule, MatFormFieldModule, MatSelectModule,
    MatInputModule, MatButtonModule, MatIconModule, MatMenuModule,
    StateContainerComponent, PageHeaderComponent,
  ],
  templateUrl: './equipment-list.component.html',
})
export class EquipmentListComponent implements OnInit {
  @Input() siteId?: string; // present when nested under /app/sites/:siteId/equipment

  readonly displayedColumns = ['name', 'assetNumber', 'qrCode', 'manufacturerModel', 'status', 'actions'];
  readonly state = signal<UiState<Equipment[]>>({ phase: 'empty' });
  readonly clients = signal<Client[]>([]);
  readonly sites = signal<InspectionSite[]>([]);
  readonly selectedClientId = signal<string>('');
  readonly selectedSiteId = signal<string>('');

  readonly filterForm = this.fb.group({ search: [''], status: [''], qrCode: [''] });
  private readonly searchTerm = signal('');
  private readonly statusTerm = signal('');

  readonly filtered = computed(() => {
    const data = this.state().data ?? [];
    const search = this.searchTerm().toLowerCase();
    const status = this.statusTerm();
    return data.filter(
      (e) =>
        (!search || e.name.toLowerCase().includes(search) || (e.assetNumber || '').toLowerCase().includes(search)) &&
        (!status || e.status === status),
    );
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly equipmentService: EquipmentService,
    private readonly sitesService: SitesService,
    private readonly clientsService: ClientsService,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    if (this.siteId) {
      this.selectedSiteId.set(this.siteId);
      this.load();
    } else {
      this.clientsService.list({ size: 200, sort: 'name,asc' }).subscribe({ next: (p) => this.clients.set(p.content) });
    }
    this.filterForm.valueChanges.pipe(debounceTime(300)).subscribe(({ search, status }) => {
      this.searchTerm.set(search || '');
      this.statusTerm.set(status || '');
    });
  }

  onClientChange(clientId: string): void {
    this.selectedClientId.set(clientId);
    this.selectedSiteId.set('');
    this.sites.set([]);
    this.state.set({ phase: 'empty' });
    if (!clientId) return;
    this.sitesService.listByClient(clientId).subscribe({ next: (sites) => this.sites.set(sites) });
  }

  onSiteChange(siteId: string): void {
    this.selectedSiteId.set(siteId);
    if (siteId) this.load();
  }

  load(): void {
    const siteId = this.selectedSiteId();
    if (!siteId) return;
    this.state.set(loadingState());
    this.equipmentService.listBySite(siteId).subscribe({
      next: (equipment) => this.state.set(successState(equipment, equipment.length === 0)),
      error: (err) => this.state.set(errorState(extractErrorMessage(err))),
    });
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
    const targetSiteId = this.siteId || this.selectedSiteId();
    const site = this.sites().find((s) => s.id === targetSiteId);
    const ref = this.dialog.open(EquipmentFormDialogComponent, { width: '640px', data: { siteId: targetSiteId, site } });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('Equipamento criado com sucesso.', 'Fechar', { duration: 3000 });
        this.load();
      }
    });
  }

  openEdit(equipment: Equipment): void {
    const targetSiteId = this.siteId || this.selectedSiteId();
    const site = this.sites().find((s) => s.id === targetSiteId);
    const ref = this.dialog.open(EquipmentFormDialogComponent, { width: '640px', data: { equipment, siteId: targetSiteId, site } });
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
    const targetStatus: EquipmentStatus = { activate: 'ACTIVE', inactivate: 'INACTIVE', decommission: 'DECOMMISSIONED' }[action] as EquipmentStatus;
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: { title: messages.title, message: messages.message, danger: action !== 'activate' },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.equipmentService.updateStatus(equipment.id, targetStatus).subscribe({
        next: () => {
          this.snackBar.open('Status atualizado.', 'Fechar', { duration: 3000 });
          this.load();
        },
        error: (err) => this.snackBar.open(extractErrorMessage(err), 'Fechar', { duration: 5000 }),
      });
    });
  }
}
