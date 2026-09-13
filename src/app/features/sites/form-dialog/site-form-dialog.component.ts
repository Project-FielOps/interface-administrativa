import { Component, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SitesService } from '../sites.service';
import { ClientsService } from '../../clients/clients.service';
import { Client, InspectionSite } from '../../../core/models/client.model';
import { extractErrorMessage } from '../../../shared/components/state-container/ui-state';

export interface SiteFormDialogData {
  site?: InspectionSite;
  clientId?: string;
}

@Component({
  selector: 'app-site-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './site-form-dialog.component.html',
})
export class SiteFormDialogComponent implements OnInit {
  readonly saving = signal(false);
  readonly errorMessage = signal('');
  readonly isEdit = !!this.data.site;
  readonly clients = signal<Client[]>([]);

  readonly form = this.fb.group({
    clientId: [this.data.site?.clientId ?? this.data.clientId ?? '', [Validators.required]],
    name: [this.data.site?.name ?? '', [Validators.required, Validators.maxLength(150)]],
    description: [this.data.site?.description ?? ''],
    addressLine: [this.data.site?.addressLine ?? ''],
    city: [this.data.site?.city ?? ''],
    state: [this.data.site?.state ?? ''],
    postalCode: [this.data.site?.postalCode ?? ''],
    latitude: [this.data.site?.latitude ?? null],
    longitude: [this.data.site?.longitude ?? null],
    contactName: [this.data.site?.contactName ?? ''],
    contactPhone: [this.data.site?.contactPhone ?? ''],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly sitesService: SitesService,
    private readonly clientsService: ClientsService,
    private readonly dialogRef: MatDialogRef<SiteFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SiteFormDialogData,
  ) {}

  ngOnInit(): void {
    if (this.data.clientId) {
      this.form.controls.clientId.disable();
    }
    this.clientsService.list({ size: 200, sort: 'name,asc', status: 'ACTIVE' }).subscribe({
      next: (page) => this.clients.set(page.content),
      error: () => this.clients.set([]),
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
    const payload = {
      clientId: raw.clientId!,
      name: raw.name!,
      description: raw.description || undefined,
      addressLine: raw.addressLine || undefined,
      city: raw.city || undefined,
      state: raw.state || undefined,
      postalCode: raw.postalCode || undefined,
      latitude: raw.latitude ?? undefined,
      longitude: raw.longitude ?? undefined,
      contactName: raw.contactName || undefined,
      contactPhone: raw.contactPhone || undefined,
      version: this.data.site?.version,
    };

    const request$ = this.isEdit
      ? this.sitesService.update(this.data.site!.id, payload)
      : this.sitesService.createForClient(raw.clientId!, payload);

    request$.subscribe({
      next: (site) => {
        this.saving.set(false);
        this.dialogRef.close(site);
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(extractErrorMessage(err));
      },
    });
  }
}
