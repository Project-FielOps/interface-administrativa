import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/auth/auth.service';
import { extractErrorMessage } from '../../shared/components/state-container/ui-state';
import {
  matchingPasswordValidator,
  PASSWORD_POLICY_MESSAGE,
  strongPasswordValidator,
} from './password-policy';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './password-recovery.component.scss',
})
export class ResetPasswordComponent implements OnInit {
  readonly saving = signal(false);
  readonly completed = signal(false);
  readonly tokenMissing = signal(false);
  readonly errorMessage = signal('');
  readonly passwordPolicyMessage = PASSWORD_POLICY_MESSAGE;
  readonly form = this.fb.nonNullable.group(
    {
      newPassword: ['', [Validators.required, strongPasswordValidator]],
      confirmation: ['', Validators.required],
    },
    { validators: matchingPasswordValidator('newPassword', 'confirmation') },
  );
  private resetToken = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.resetToken = this.route.snapshot.queryParamMap.get('token') ?? '';
    this.tokenMissing.set(!this.resetToken);
    // Consume the URL token immediately. It is intentionally retained only in this component's memory.
    if (this.resetToken) void this.router.navigate(['/reset-password'], { replaceUrl: true });
  }

  submit(): void {
    if (this.tokenMissing()) {
      this.errorMessage.set(
        'O link de recuperação não contém um token válido. Solicite outro link.',
      );
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.errorMessage.set('');
    this.auth.resetPassword(this.resetToken, this.form.controls.newPassword.value).subscribe({
      next: () => {
        this.saving.set(false);
        this.completed.set(true);
        this.resetToken = '';
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(
          err?.status === 401
            ? 'O link de recuperação é inválido, expirou ou já foi usado.'
            : extractErrorMessage(err),
        );
      },
    });
  }
}
