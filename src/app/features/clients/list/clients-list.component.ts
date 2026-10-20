import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
import { ClientsService } from '../clients.service';
import { Client } from '../../../core/models/client.model';
import { StateContainerComponent } from '../../../shared/components/state-container/state-container.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import {
  UiState,
  errorState,
  extractErrorMessage,
  loadingState,
  successState,
  requestErrorState,
} from '../../../shared/components/state-container/ui-state';
import { ClientFormDialogComponent } from '../form-dialog/client-form-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-clients-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatPaginatorModule,
    StateContainerComponent,
    PageHeaderComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './clients-list.component.html',
})
export class ClientsListComponent implements OnInit {
  readonly displayedColumns = ['name', 'document', 'email', 'phone', 'status', 'actions'];
  readonly state = signal<UiState<Client[]>>(loadingState());
  readonly totalElements = signal(0);
  readonly pageSize = signal(10);
  readonly pageIndex = signal(0);

  readonly filterForm = this.fb.group({ search: [''], status: [''] });

  constructor(
    private readonly fb: FormBuilder,
    private readonly clientsService: ClientsService,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar,
    private readonly router: Router,
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
    this.clientsService
      .list({
        name: search || undefined,
        status: status || undefined,
        page: this.pageIndex(),
        size: this.pageSize(),
        sort: 'name,asc',
      })
      .subscribe({
        next: (page) => {
          this.totalElements.set(page.totalElements);
          this.state.set(
            successState(
              page.content,
              page.content.length === 0,
              Object.values(this.filterForm.getRawValue()).some(Boolean),
            ),
          );
        },
        error: (err) => this.state.set(requestErrorState(err)),
      });
  }

  clearFilters(): void {
    this.filterForm.reset({ search: '', status: '' });
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  openCreate(): void {
    const ref = this.dialog.open(ClientFormDialogComponent, { width: '560px', data: {} });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('Cliente criado com sucesso.', 'Fechar', { duration: 3000 });
        this.load();
      }
    });
  }

  openEdit(client: Client): void {
    const ref = this.dialog.open(ClientFormDialogComponent, { width: '560px', data: { client } });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('Cliente atualizado com sucesso.', 'Fechar', { duration: 3000 });
        this.load();
      }
    });
  }

  viewSites(client: Client): void {
    this.router.navigate(['/app/clients', client.id, 'sites']);
  }

  toggleStatus(client: Client): void {
    const activating = client.status === 'INACTIVE';
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: activating ? 'Ativar cliente' : 'Inativar cliente',
        message: activating
          ? `Ativar o cliente ${client.name}?`
          : `Inativar o cliente ${client.name}? Ele não poderá ser selecionado em novos agendamentos.`,
        danger: !activating,
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.clientsService.updateStatus(client.id, activating ? 'ACTIVE' : 'INACTIVE').subscribe({
        next: () => {
          this.snackBar.open('Status atualizado.', 'Fechar', { duration: 3000 });
          this.load();
        },
        error: (err) => this.snackBar.open(extractErrorMessage(err), 'Fechar', { duration: 5000 }),
      });
    });
  }
}
