import { Component, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EquipmentService } from '../equipment.service';
import { SitesService } from '../../sites/sites.service';
import { Equipment, InspectionSite } from '../../../core/models/client.model';
import { extractErrorMessage } from '../../../shared/components/state-container/ui-state';

export interface EquipmentFormDialogData {
  equipment?: Equipment;
  siteId?: string;
}

@Component({
  selector: 'app-equipment-form-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatDatepickerModule, MatNativeDateModule, MatProgressSpinnerModule,
  ],
  templateUrl: './equipment-form-dialog.component.html',
})
export class EquipmentFormDialogComponent implements OnInit {
  readonly saving = signal(false);
  readonly errorMessage = signal('');
  readonly isEdit = !!this.data.equipment;
  readonly sites = signal<InspectionSite[]>([]);

  readonly form = this.fb.group({
    siteId: [this.data.equipment?.siteId ?? this.data.siteId ?? '', [Validators.required]],
    name: [this.data.equipment?.name ?? '', [Validators.required, Validators.maxLength(150)]],
    assetNumber: [this.data.equipment?.assetNumber ?? ''],
    serialNumber: [this.data.equipment?.serialNumber ?? ''],
    manufacturer: [this.data.equipment?.manufacturer ?? ''],
    model: [this.data.equipment?.model ?? ''],
    description: [this.data.equipment?.description ?? ''],
    qrCode: [this.data.equipment?.qrCode ?? '', [Validators.required]],
    installedAt: [this.data.equipment?.installedAt ? new Date(this.data.equipment.installedAt) : null],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly equipmentService: EquipmentService,
    private readonly sitesService: SitesService,
    private readonly dialogRef: MatDialogRef<EquipmentFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EquipmentFormDialogData,
  ) {}

  ngOnInit(): void {
    if (this.data.siteId) {
      this.form.controls.siteId.disable();
    }
    this.sitesService.list({ size: 200, sort: 'name,asc', status: 'ACTIVE' }).subscribe({
      next: (page) => this.sites.set(page.content),
      error: () => this.sites.set([]),
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
      siteId: raw.siteId!,
      name: raw.name!,
      assetNumber: raw.assetNumber || undefined,
      serialNumber: raw.serialNumber || undefined,
      manufacturer: raw.manufacturer || undefined,
      model: raw.model || undefined,
      description: raw.description || undefined,
      qrCode: raw.qrCode!,
      installedAt: raw.installedAt ? new Date(raw.installedAt).toISOString().substring(0, 10) : undefined,
      version: this.data.equipment?.version,
    };

    const request$ = this.isEdit
      ? this.equipmentService.update(this.data.equipment!.id, payload)
      : this.equipmentService.create(payload);

    request$.subscribe({
      next: (equipment) => {
        this.saving.set(false);
        this.dialogRef.close(equipment);
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(extractErrorMessage(err));
      },
    });
  }
}
