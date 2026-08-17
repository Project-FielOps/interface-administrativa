import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
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
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { extractErrorMessage } from '../../../shared/components/state-container/ui-state';

@Component({
  selector: 'app-inspection-new',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatDatepickerModule, MatNativeDateModule, MatProgressSpinnerModule, PageHeaderComponent,
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
    this.templatesService.list({ size: 200, status: 'ACTIVE', sort: 'title,asc' }).subscribe({ next: (p) => this.templates.set(p.content) });
    this.clientsService.list({ size: 200, status: 'ACTIVE', sort: 'name,asc' }).subscribe({ next: (p) => this.clients.set(p.content) });
    this.usersService.list({ size: 200, role: 'TECHNICIAN', status: 'ACTIVE' }).subscribe({ next: (p) => this.technicians.set(p.content) });
    this.usersService.list({ size: 200, role: 'SUPERVISOR', status: 'ACTIVE' }).subscribe({ next: (p) => this.supervisors.set(p.content) });

    this.form.controls.templateId.valueChanges.subscribe((templateId) => {
      this.form.controls.templateVersionNumber.setValue(null);
      this.versions.set([]);
      if (!templateId) return;
      this.templatesService.getVersions(templateId).subscribe({
        next: (versions) => {
          const active = versions.filter((v) => v.activeForNewInspections).sort((a, b) => b.versionNumber - a.versionNumber);
          this.versions.set(active);
          if (active.length === 1) {
            this.form.controls.templateVersionNumber.setValue(active[0].versionNumber);
          }
        },
      });
    });

    this.form.controls.clientId.valueChanges.subscribe((clientId) => {
      this.form.controls.siteId.setValue('');
      this.form.controls.equipmentId.setValue('');
      this.sites.set([]);
      this.equipment.set([]);
      if (!clientId) return;
      this.sitesService.listByClient(clientId).subscribe({ next: (sites) => this.sites.set(sites) });
    });

    this.form.controls.siteId.valueChanges.subscribe((siteId) => {
      this.form.controls.equipmentId.setValue('');
      this.equipment.set([]);
      if (!siteId) return;
      this.equipmentService.listBySite(siteId).subscribe({ next: (eq) => this.equipment.set(eq) });
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.errorMessage.set('');
    const raw = this.form.getRawValue();
    this.inspectionsService
      .create({
        templateId: raw.templateId!,
        templateVersionNumber: raw.templateVersionNumber ?? undefined,
        clientId: raw.clientId!,
        siteId: raw.siteId!,
        equipmentId: raw.equipmentId || undefined,
        technicianId: raw.technicianId!,
        supervisorId: raw.supervisorId!,
        title: raw.title!,
        instructions: raw.instructions || undefined,
        priority: raw.priority as any,
        scheduledFor: new Date(raw.scheduledFor!).toISOString(),
      })
      .subscribe({
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
