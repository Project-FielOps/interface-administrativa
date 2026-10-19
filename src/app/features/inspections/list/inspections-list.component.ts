import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
import { debounceTime, distinctUntilChanged, map } from 'rxjs';
import { InspectionListQuery, InspectionsService } from '../inspections.service';
import { ClientsService } from '../../clients/clients.service';
import { UsersService } from '../../users/users.service';
import { Inspection } from '../../../core/models/inspection.model';
import { Client } from '../../../core/models/client.model';
import { User } from '../../../core/models/user.model';
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
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-inspections-list',
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
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatPaginatorModule,
    StateContainerComponent,
    PageHeaderComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './inspections-list.component.html',
})
export class InspectionsListComponent implements OnInit {
  readonly displayedColumns = [
    'title',
    'client',
    'technician',
    'priority',
    'status',
    'scheduledFor',
    'actions',
  ];
  readonly state = signal<UiState<Inspection[]>>(loadingState());
  readonly totalElements = signal(0);
  readonly pageSize = signal(10);
  readonly pageIndex = signal(0);
  readonly clients = signal<Client[]>([]);
  readonly technicians = signal<User[]>([]);
  readonly supervisors = signal<User[]>([]);

  readonly filterForm = this.fb.group({
    status: [''],
    technicianId: [''],
    supervisorId: [''],
    clientId: [''],
    siteId: [''],
    priority: [''],
    from: [null as Date | null],
    to: [null as Date | null],
    overdue: [false],
    awaitingReview: [false],
  });

  clearFilters(): void {
    this.filterForm.reset({
      status: '',
      technicianId: '',
      supervisorId: '',
      clientId: '',
      siteId: '',
      priority: '',
      from: null,
      to: null,
      overdue: false,
      awaitingReview: false,
    });
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly inspectionsService: InspectionsService,
    private readonly clientsService: ClientsService,
    private readonly usersService: UsersService,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(map((params) => this.filtersFromUrl(params)))
      .subscribe((filters) => {
        this.filterForm.patchValue(filters, { emitEvent: false });
        this.pageIndex.set(this.numberParam(filters['page'], 0));
        this.pageSize.set(this.numberParam(filters['size'], 10));
        this.load();
      });
    this.clientsService
      .list({ size: 200, sort: 'name,asc' })
      .subscribe({ next: (p) => this.clients.set(p.content) });
    this.usersService
      .listAssignable('TECHNICIAN')
      .subscribe({ next: (p) => this.technicians.set(p.content) });
    this.usersService
      .listAssignable('SUPERVISOR')
      .subscribe({ next: (p) => this.supervisors.set(p.content) });
    this.filterForm.valueChanges.pipe(debounceTime(350), distinctUntilChanged()).subscribe(() => {
      this.pageIndex.set(0);
      this.persistUrl();
    });
  }

  load(): void {
    this.state.set(loadingState());
    const f = this.filterForm.getRawValue();
    this.inspectionsService
      .listPage({
        status: f.status || undefined,
        technicianId: f.technicianId || undefined,
        supervisorId: f.supervisorId || undefined,
        clientId: f.clientId || undefined,
        siteId: f.siteId || undefined,
        priority: f.priority || undefined,
        scheduledFrom: f.from ? new Date(f.from).toISOString() : undefined,
        scheduledTo: f.to ? new Date(f.to).toISOString() : undefined,
        overdue: f.overdue || undefined,
        awaitingReview: f.awaitingReview || undefined,
        page: this.pageIndex(),
        size: this.pageSize(),
        sort: 'scheduledFor,desc',
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

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.persistUrl();
  }

  private filtersFromUrl(params: import('@angular/router').ParamMap): Record<string, unknown> {
    const date = (value: string | null): Date | null => {
      if (!value) return null;
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    };
    return {
      status: params.get('status') || '',
      technicianId: params.get('technicianId') || '',
      supervisorId: params.get('supervisorId') || '',
      clientId: params.get('clientId') || '',
      siteId: params.get('siteId') || '',
      priority: params.get('priority') || '',
      from: date(params.get('scheduledFrom')),
      to: date(params.get('scheduledTo')),
      overdue: params.get('overdue') === 'true',
      awaitingReview: params.get('awaitingReview') === 'true',
      page: params.get('page'),
      size: params.get('size'),
    };
  }

  private persistUrl(): void {
    const f = this.filterForm.getRawValue();
    void this.router.navigate([], {
      relativeTo: this.route,
      replaceUrl: true,
      queryParams: {
        status: f.status || null,
        technicianId: f.technicianId || null,
        supervisorId: f.supervisorId || null,
        clientId: f.clientId || null,
        siteId: f.siteId || null,
        priority: f.priority || null,
        scheduledFrom: f.from ? f.from.toISOString() : null,
        scheduledTo: f.to ? f.to.toISOString() : null,
        overdue: f.overdue ? true : null,
        awaitingReview: f.awaitingReview ? true : null,
        page: this.pageIndex() || null,
        size: this.pageSize() === 10 ? null : this.pageSize(),
      },
    });
  }

  private numberParam(value: unknown, fallback: number): number {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
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
    return ['ASSIGNED', 'IN_PROGRESS', 'REJECTED'].includes(inspection.status);
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
