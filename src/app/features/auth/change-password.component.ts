import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/auth/auth.service';
import { extractErrorMessage } from '../../shared/components/state-container/ui-state';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="fo-page">
      <mat-card style="padding: 24px; max-width: 520px; margin: 48px auto">
        <h1>Trocar senha</h1>
        <p>Por segurança, defina uma nova senha antes de continuar.</p>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <mat-form-field class="fo-full"
            ><mat-label>Senha atual</mat-label
            ><input matInput type="password" formControlName="currentPassword"
          /></mat-form-field>
          <mat-form-field class="fo-full"
            ><mat-label>Nova senha</mat-label
            ><input matInput type="password" formControlName="newPassword" />
            @if (
              form.controls.newPassword.hasError('minlength') && form.controls.newPassword.touched
            ) {
              <mat-error>Mínimo de 8 caracteres</mat-error>
            }
          </mat-form-field>
          <mat-form-field class="fo-full"
            ><mat-label>Confirme a nova senha</mat-label
            ><input matInput type="password" formControlName="confirmation"
          /></mat-form-field>
          @if (errorMessage()) {
            <p class="fo-dialog-error" role="alert">{{ errorMessage() }}</p>
          }
          <button mat-raised-button color="primary" type="submit" [disabled]="saving()">
            {{ saving() ? 'Salvando...' : 'Salvar nova senha' }}
          </button>
        </form>
      </mat-card>
    </div>
  `,
})
export class ChangePasswordComponent {
  readonly saving = signal(false);
  readonly errorMessage = signal('');
  readonly form = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmation: ['', Validators.required],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  submit(): void {
    if (this.form.invalid) return this.form.markAllAsTouched();
    const { currentPassword, newPassword, confirmation } = this.form.getRawValue();
    if (newPassword !== confirmation) {
      this.errorMessage.set('A confirmação da senha não coincide.');
      return;
    }
    this.saving.set(true);
    this.errorMessage.set('');
    this.auth.changePassword(currentPassword, newPassword).subscribe({
      next: () => this.router.navigate(['/app/dashboard']),
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(extractErrorMessage(err));
      },
    });
  }
}
