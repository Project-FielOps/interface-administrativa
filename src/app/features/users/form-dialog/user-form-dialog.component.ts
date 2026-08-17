import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UsersService } from '../users.service';
import { User, UserRole } from '../../../core/models/user.model';
import { extractErrorMessage } from '../../../shared/components/state-container/ui-state';

export interface UserFormDialogData {
  user?: User;
}

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'SUPERVISOR', label: 'Supervisor' },
  { value: 'TECHNICIAN', label: 'Técnico' },
  { value: 'CLIENT_VIEWER', label: 'Cliente (visualização)' },
];

@Component({
  selector: 'app-user-form-dialog',
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
  templateUrl: './user-form-dialog.component.html',
})
export class UserFormDialogComponent {
  readonly roles = ROLES;
  readonly saving = signal(false);
  readonly errorMessage = signal('');
  readonly isEdit = !!this.data.user;

  readonly form = this.fb.group({
    name: [this.data.user?.name ?? '', [Validators.required, Validators.maxLength(120)]],
    email: [this.data.user?.email ?? '', [Validators.required, Validators.email]],
    phone: [this.data.user?.phone ?? ''],
    role: [this.data.user?.role ?? 'TECHNICIAN', [Validators.required]],
    password: ['', this.isEdit ? [] : [Validators.required, Validators.minLength(6)]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly usersService: UsersService,
    private readonly dialogRef: MatDialogRef<UserFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserFormDialogData,
  ) {}

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.errorMessage.set('');
    const raw = this.form.getRawValue();

    const request$ = this.isEdit
      ? this.usersService.update(this.data.user!.id, {
          name: raw.name!,
          role: raw.role as UserRole,
          phone: raw.phone || undefined,
          version: this.data.user!.version,
        })
      : this.usersService.create({
          name: raw.name!,
          email: raw.email!,
          role: raw.role as UserRole,
          phone: raw.phone || undefined,
          password: raw.password!,
        });

    request$.subscribe({
      next: (user) => {
        this.saving.set(false);
        this.dialogRef.close(user);
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(extractErrorMessage(err));
        this.applyFieldErrors(err);
      },
    });
  }

  private applyFieldErrors(err: unknown): void {
    const fieldErrors = (err as { error?: { fieldErrors?: { field: string; message: string }[] } })?.error?.fieldErrors;
    fieldErrors?.forEach((fe) => {
      const control = this.form.get(fe.field);
      if (control) {
        control.setErrors({ ...(control.errors ?? {}), server: fe.message });
      }
    });
  }
}
