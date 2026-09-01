import { Component, Input, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FoLabelPipe } from '../../../shared/pipes/fo-label.pipe';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
import { SitesService } from '../sites.service';
import { ClientsService } from '../../clients/clients.service';
import { Client, InspectionSite } from '../../../core/models/client.model';
import { StateContainerComponent } from '../../../shared/components/state-container/state-container.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { UiState, errorState, extractErrorMessage, loadingState, successState } from '../../../shared/components/state-container/ui-state';
import { SiteFormDialogComponent } from '../form-dialog/site-form-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

/**
 * The real backend has no flat GET /sites list — sites are only listable nested under a
 * client (GET /clients/{clientId}/sites). When this component isn't given a clientId via
 * route input (i.e. the top-level "Locais" screen, not /app/clients/:clientId/sites), it
 * shows a client picker first and lists that client's sites, filtering client-side.
 */
@Component({
  selector: 'app-sites-list',
  standalone: true,
  imports: [
    FoLabelPipe,
    CommonModule, ReactiveFormsModule, MatTableModule, MatFormFieldModule, MatSelectModule,
    MatInputModule, MatButtonModule, MatIconModule, MatMenuModule,
    StateContainerComponent, PageHeaderComponent,
  ],
  templateUrl: './sites-list.component.html',
})
export class SitesListComponent implements OnInit {
  @Input() clientId?: string; // present when nested under /app/clients/:clientId/sites

  readonly displayedColumns = ['name', 'city', 'contactName', 'status', 'actions'];
  readonly state = signal<UiState<InspectionSite[]>>({ phase: 'empty' });
  readonly clients = signal<Client[]>([]);
  readonly selectedClientId = signal<string>('');

  readonly filterForm = this.fb.group({ search: [''], status: [''] });
  private readonly searchTerm = signal('');
  private readonly statusTerm = signal('');

  readonly filtered = computed(() => {
    const data = this.state().data ?? [];
    const search = this.searchTerm().toLowerCase();
    const status = this.statusTerm();
    return data.filter((s) => (!search || s.name.toLowerCase().includes(search)) && (!status || s.status === status));
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly sitesService: SitesService,
    private readonly clientsService: ClientsService,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    if (this.clientId) {
      this.selectedClientId.set(this.clientId);
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
    if (clientId) this.load();
  }

  load(): void {
    const clientId = this.selectedClientId();
    if (!clientId) return;
    this.state.set(loadingState());
    this.sitesService.listByClient(clientId).subscribe({
      next: (sites) => this.state.set(successState(sites, sites.length === 0)),
      error: (err) => this.state.set(errorState(extractErrorMessage(err))),
    });
  }

  openCreate(): void {
    const targetClientId = this.clientId || this.selectedClientId();
    const ref = this.dialog.open(SiteFormDialogComponent, { width: '640px', data: { clientId: targetClientId } });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('Local criado com sucesso.', 'Fechar', { duration: 3000 });
        this.load();
      }
    });
  }

  openEdit(site: InspectionSite): void {
    const ref = this.dialog.open(SiteFormDialogComponent, { width: '640px', data: { site, clientId: this.clientId || this.selectedClientId() } });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('Local atualizado com sucesso.', 'Fechar', { duration: 3000 });
        this.load();
      }
    });
  }

  viewEquipment(site: InspectionSite): void {
    this.router.navigate(['/app/sites', site.id, 'equipment']);
  }

  toggleStatus(site: InspectionSite): void {
    const activating = site.status === 'INACTIVE';
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: activating ? 'Ativar local' : 'Inativar local',
        message: activating ? `Ativar o local ${site.name}?` : `Inativar o local ${site.name}?`,
        danger: !activating,
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.sitesService.updateStatus(site.id, activating ? 'ACTIVE' : 'INACTIVE').subscribe({
        next: () => {
          this.snackBar.open('Status atualizado.', 'Fechar', { duration: 3000 });
          this.load();
        },
        error: (err) => this.snackBar.open(extractErrorMessage(err), 'Fechar', { duration: 5000 }),
      });
    });
  }
}
