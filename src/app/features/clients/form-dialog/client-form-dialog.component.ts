import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ClientsService } from '../clients.service';
import { Client } from '../../../core/models/client.model';
import { extractErrorMessage } from '../../../shared/components/state-container/ui-state';

export interface ClientFormDialogData {
  client?: Client;
}

@Component({
  selector: 'app-client-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './client-form-dialog.component.html',
})
export class ClientFormDialogComponent {
  readonly saving = signal(false);
  readonly errorMessage = signal('');
  readonly isEdit = !!this.data.client;

  readonly form = this.fb.group({
    name: [this.data.client?.name ?? '', [Validators.required, Validators.maxLength(150)]],
    legalName: [this.data.client?.legalName ?? ''],
    document: [this.data.client?.document ?? ''],
    email: [this.data.client?.email ?? '', [Validators.email]],
    phone: [this.data.client?.phone ?? ''],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly clientsService: ClientsService,
    private readonly dialogRef: MatDialogRef<ClientFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ClientFormDialogData,
  ) {}

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.errorMessage.set('');
    const raw = this.form.getRawValue();
    const payload = {
      name: raw.name!,
      legalName: raw.legalName || undefined,
      document: raw.document || undefined,
      email: raw.email || undefined,
      phone: raw.phone || undefined,
      version: this.data.client?.version,
    };

    const request$ = this.isEdit
      ? this.clientsService.update(this.data.client!.id, payload)
      : this.clientsService.create(payload);

    request$.subscribe({
      next: (client) => {
        this.saving.set(false);
        this.dialogRef.close(client);
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(extractErrorMessage(err));
      },
    });
  }
}
