import { Component, OnInit, signal } from '@angular/core';
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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime } from 'rxjs';
import { InspectionsService } from '../inspections.service';
import { ClientsService } from '../../clients/clients.service';
import { UsersService } from '../../users/users.service';
import { Inspection } from '../../../core/models/inspection.model';
import { Client } from '../../../core/models/client.model';
import { User } from '../../../core/models/user.model';
import { StateContainerComponent } from '../../../shared/components/state-container/state-container.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { UiState, errorState, extractErrorMessage, loadingState, successState } from '../../../shared/components/state-container/ui-state';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-inspections-list',
  standalone: true,
  imports: [
    FoLabelPipe,
    CommonModule, ReactiveFormsModule, MatTableModule, MatFormFieldModule, MatSelectModule,
    MatInputModule, MatButtonModule, MatIconModule, MatMenuModule, MatCheckboxModule,
    MatDatepickerModule, MatNativeDateModule, MatPaginatorModule, StateContainerComponent, PageHeaderComponent,
  ],
  templateUrl: './inspections-list.component.html',
})
export class InspectionsListComponent implements OnInit {
  readonly displayedColumns = ['title', 'client', 'technician', 'priority', 'status', 'scheduledFor', 'actions'];
  readonly state = signal<UiState<Inspection[]>>(loadingState());
  readonly totalElements = signal(0);
  readonly pageSize = signal(10);
  readonly pageIndex = signal(0);
  readonly clients = signal<Client[]>([]);
  readonly technicians = signal<User[]>([]);

  readonly filterForm = this.fb.group({
    status: [''],
    technicianId: [''],
    clientId: [''],
    priority: [''],
    from: [null as Date | null],
    to: [null as Date | null],
    overdue: [false],
    awaitingReview: [false],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly inspectionsService: InspectionsService,
    private readonly clientsService: ClientsService,
    private readonly usersService: UsersService,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.load();
    this.clientsService.list({ size: 200, sort: 'name,asc' }).subscribe({ next: (p) => this.clients.set(p.content) });
    this.usersService.list({ size: 200, role: 'TECHNICIAN', status: 'ACTIVE' }).subscribe({ next: (p) => this.technicians.set(p.content) });
    this.filterForm.valueChanges.pipe(debounceTime(350)).subscribe(() => {
      this.pageIndex.set(0);
      this.load();
    });
  }

  load(): void {
    this.state.set(loadingState());
    const f = this.filterForm.getRawValue();
    this.inspectionsService
      .list({
        status: f.status || undefined,
        technicianId: f.technicianId || undefined,
        clientId: f.clientId || undefined,
        priority: f.priority || undefined,
        from: f.from ? new Date(f.from).toISOString() : undefined,
        to: f.to ? new Date(f.to).toISOString() : undefined,
        overdue: f.overdue || undefined,
        awaitingReview: f.awaitingReview || undefined,
        page: this.pageIndex(),
        size: this.pageSize(),
        sort: 'scheduledFor,desc',
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

  create(): void {
    this.router.navigate(['/app/inspections/new']);
  }

  view(inspection: Inspection): void {
    this.router.navigate(['/app/inspections', inspection.id]);
  }

  review(inspection: Inspection): void {
    this.router.navigate(['/app/inspections', inspection.id, 'review']);
  }

  canCancel(inspection: Inspection): boolean {
    return !['APPROVED', 'REJECTED', 'CANCELED'].includes(inspection.status);
  }

  cancel(inspection: Inspection): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '460px',
      data: {
        title: 'Cancelar inspeção',
        message: `Cancelar a inspeção "${inspection.title}"? Esta ação exige um motivo.`,
        requireReason: true,
        reasonLabel: 'Motivo do cancelamento',
        confirmLabel: 'Cancelar inspeção',
        danger: true,
      },
    });
    ref.afterClosed().subscribe((reason) => {
      if (!reason) return;
      this.inspectionsService.cancel(inspection.id, reason).subscribe({
        next: () => {
          this.snackBar.open('Inspeção cancelada.', 'Fechar', { duration: 3000 });
          this.load();
        },
        error: (err) => this.snackBar.open(extractErrorMessage(err), 'Fechar', { duration: 5000 }),
      });
    });
  }
}
