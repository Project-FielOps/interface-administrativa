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
import {
  matchingPasswordValidator,
  PASSWORD_POLICY_MESSAGE,
  strongPasswordValidator,
} from './password-policy';

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
          <mat-form-field class="fo-full">
            <mat-label>Nova senha</mat-label>
            <input
              matInput
              type="password"
              formControlName="newPassword"
              autocomplete="new-password"
            />
            @if (
              form.controls.newPassword.hasError('required') && form.controls.newPassword.touched
            ) {
              <mat-error>Nova senha é obrigatória</mat-error>
            } @else if (
              form.controls.newPassword.hasError('weakPassword') &&
              form.controls.newPassword.touched
            ) {
              <mat-error>{{ passwordPolicyMessage }}</mat-error>
            }
          </mat-form-field>
          <p style="color: var(--fo-text-secondary); font-size: 12px; margin: -8px 0 16px">
            {{ passwordPolicyMessage }}
          </p>
          <mat-form-field class="fo-full"
            ><mat-label>Confirme a nova senha</mat-label
            ><input
              matInput
              type="password"
              formControlName="confirmation"
              autocomplete="new-password"
            />
            @if (
              form.controls.confirmation.hasError('required') && form.controls.confirmation.touched
            ) {
              <mat-error>Confirme a nova senha</mat-error>
            } @else if (form.hasError('passwordMismatch') && form.controls.confirmation.touched) {
              <mat-error>A confirmação não coincide com a nova senha</mat-error>
            }
            /></mat-form-field
          >
          @if (form.hasError('passwordMismatch') && form.controls.confirmation.touched) {
            <p style="color: var(--fo-danger, #b42318); margin: -8px 0 12px" role="alert">
              A confirmação não coincide com a nova senha
            </p>
          }
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
  readonly passwordPolicyMessage = PASSWORD_POLICY_MESSAGE;
  readonly form = this.fb.nonNullable.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, strongPasswordValidator]],
      confirmation: ['', Validators.required],
    },
    { validators: matchingPasswordValidator('newPassword', 'confirmation') },
  );

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  submit(): void {
    if (this.form.invalid) return this.form.markAllAsTouched();
    const { currentPassword, newPassword, confirmation } = this.form.getRawValue();
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
