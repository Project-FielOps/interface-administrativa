import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, of, switchMap } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InspectionsService } from '../inspections.service';
import { ClientsService } from '../../clients/clients.service';
import { SitesService } from '../../sites/sites.service';
import { EquipmentService } from '../../equipment/equipment.service';
import { UsersService } from '../../users/users.service';
import { TemplatesService } from '../../templates/templates.service';
import { Client, Equipment, InspectionSite } from '../../../core/models/client.model';
import { User } from '../../../core/models/user.model';
import { InspectionTemplate, InspectionTemplateVersion } from '../../../core/models/template.model';
import { InspectionPriority, InspectionCreateRequest } from '../../../core/models/inspection.model';
import {
  UiState,
  errorState,
  extractErrorMessage,
  loadingState,
  successState,
} from '../../../shared/components/state-container/ui-state';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

type AssignableRole = 'TECHNICIAN' | 'SUPERVISOR';

export function toScheduledForIso(value: Date | string): string {
  return new Date(value).toISOString();
}

@Component({
  selector: 'app-inspection-new',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    PageHeaderComponent,
  ],
  templateUrl: './inspection-new.component.html',
})
export class InspectionNewComponent implements OnInit {
  readonly saving = signal(false);
  readonly errorMessage = signal('');

  readonly clients = signal<Client[]>([]);
  readonly sites = signal<InspectionSite[]>([]);
  readonly equipment = signal<Equipment[]>([]);
  readonly technicians = signal<User[]>([]);
  readonly supervisors = signal<User[]>([]);
  readonly templates = signal<InspectionTemplate[]>([]);
  readonly versions = signal<InspectionTemplateVersion[]>([]);
  readonly clientsState = signal<UiState<Client[]>>(loadingState());
  readonly sitesState = signal<UiState<InspectionSite[]>>({ phase: 'idle' });
  readonly equipmentState = signal<UiState<Equipment[]>>({ phase: 'idle' });
  readonly techniciansState = signal<UiState<User[]>>(loadingState());
  readonly supervisorsState = signal<UiState<User[]>>(loadingState());
  readonly templatesState = signal<UiState<InspectionTemplate[]>>(loadingState());
  readonly versionsState = signal<UiState<InspectionTemplateVersion[]>>({ phase: 'idle' });

  readonly form = this.fb.group({
    templateId: ['', [Validators.required]],
    templateVersionNumber: [null as number | null, [Validators.required]],
    clientId: ['', [Validators.required]],
    siteId: ['', [Validators.required]],
    equipmentId: [''],
    technicianId: ['', [Validators.required]],
    supervisorId: ['', [Validators.required]],
    title: ['', [Validators.required, Validators.maxLength(150)]],
    instructions: [''],
    priority: ['MEDIUM', [Validators.required]],
    scheduledFor: [null as Date | null, [Validators.required]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly inspectionsService: InspectionsService,
    private readonly clientsService: ClientsService,
    private readonly sitesService: SitesService,
    private readonly equipmentService: EquipmentService,
    private readonly usersService: UsersService,
    private readonly templatesService: TemplatesService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.loadTemplates();
    this.loadClients();
    this.loadAssignable('TECHNICIAN');
    this.loadAssignable('SUPERVISOR');

    this.form.controls.templateId.valueChanges.subscribe((templateId) => {
      this.form.controls.templateVersionNumber.setValue(null);
      this.versions.set([]);
      this.versionsState.set(templateId ? loadingState() : { phase: 'idle' });
      if (!templateId) return;
      this.templatesService.getVersions(templateId).subscribe({
        next: (versions) => {
          const active = versions
            .filter((v) => v.activeForNewInspections)
            .sort((a, b) => b.versionNumber - a.versionNumber);
          this.versions.set(active);
          this.versionsState.set(successState(active, active.length === 0));
          if (active.length === 1) {
            this.form.controls.templateVersionNumber.setValue(active[0].versionNumber);
          }
        },
        error: (err) => this.versionsState.set(errorState(extractErrorMessage(err))),
      });
    });

    this.form.controls.clientId.valueChanges.subscribe((clientId) => {
      this.form.controls.siteId.setValue('');
      this.form.controls.equipmentId.setValue('');
      this.sites.set([]);
      this.equipment.set([]);
      this.sitesState.set(clientId ? loadingState() : { phase: 'idle' });
      this.equipmentState.set({ phase: 'idle' });
      if (!clientId) return;
      this.sitesService.listByClient(clientId).subscribe({
        next: (sites) => {
          const active = sites.filter((site) => site.status === 'ACTIVE');
          this.sites.set(active);
          this.sitesState.set(successState(active, active.length === 0));
        },
        error: (err) => this.sitesState.set(errorState(extractErrorMessage(err))),
      });
    });

    this.form.controls.siteId.valueChanges.subscribe((siteId) => {
      this.form.controls.equipmentId.setValue('');
      this.equipment.set([]);
      this.equipmentState.set(siteId ? loadingState() : { phase: 'idle' });
      if (!siteId) return;
      this.equipmentService.listBySite(siteId).subscribe({
        next: (equipment) => {
          const active = equipment.filter((item) => item.status === 'ACTIVE');
          this.equipment.set(active);
          this.equipmentState.set(successState(active, active.length === 0));
        },
        error: (err) => this.equipmentState.set(errorState(extractErrorMessage(err))),
      });
    });
  }

  private loadClients(): void {
    this.clientsService.list({ size: 200, status: 'ACTIVE', sort: 'name,asc' }).subscribe({
      next: (page) => {
        const active = page.content.filter((client) => client.status === 'ACTIVE');
        this.clients.set(active);
        this.clientsState.set(successState(active, active.length === 0));
      },
      error: (err) => this.clientsState.set(errorState(extractErrorMessage(err))),
    });
  }

  private loadTemplates(): void {
    this.templatesService.list({ size: 200, status: 'ACTIVE', sort: 'title,asc' }).subscribe({
      next: (page) => {
        const active = page.content.filter((template) => template.status === 'ACTIVE');
        this.templates.set(active);
        this.templatesState.set(successState(active, active.length === 0));
      },
      error: (err) => this.templatesState.set(errorState(extractErrorMessage(err))),
    });
  }

  private loadAssignable(role: AssignableRole): void {
    const state = role === 'TECHNICIAN' ? this.techniciansState : this.supervisorsState;
    const target = role === 'TECHNICIAN' ? this.technicians : this.supervisors;
    state.set(loadingState());
    this.loadAssignablePages(role).subscribe({
      next: (users) => {
        target.set(users.filter((user) => user.status === 'ACTIVE' && user.role === role));
        state.set(successState(target(), target().length === 0));
      },
      error: (err) => state.set(errorState(extractErrorMessage(err))),
    });
  }

  private loadAssignablePages(
    role: AssignableRole,
    page = 0,
    users: User[] = [],
  ): Observable<User[]> {
    return this.usersService.listAssignable(role, { page, size: 100, sort: 'name,asc' }).pipe(
      switchMap((result) => {
        const combined = [...users, ...result.content];
        return result.totalPages > page + 1
          ? this.loadAssignablePages(role, page + 1, combined)
          : of(combined);
      }),
    );
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.errorMessage.set('');
    const raw = this.form.getRawValue();
    const request: InspectionCreateRequest = {
      templateId: raw.templateId!,
      templateVersionNumber: raw.templateVersionNumber ?? undefined,
      clientId: raw.clientId!,
      siteId: raw.siteId!,
      equipmentId: raw.equipmentId || undefined,
      technicianId: raw.technicianId!,
      supervisorId: raw.supervisorId!,
      title: raw.title!,
      instructions: raw.instructions || undefined,
      priority: raw.priority as InspectionPriority,
      scheduledFor: toScheduledForIso(raw.scheduledFor!),
    };
    this.inspectionsService.create(request).subscribe({
      next: (inspection) => {
        this.saving.set(false);
        this.router.navigate(['/app/inspections', inspection.id]);
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(extractErrorMessage(err));
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/app/inspections']);
  }
}
