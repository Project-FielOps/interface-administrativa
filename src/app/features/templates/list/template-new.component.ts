import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TemplatesService } from '../templates.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { extractErrorMessage } from '../../../shared/components/state-container/ui-state';

@Component({
  selector: 'app-template-new',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatProgressSpinnerModule, PageHeaderComponent],
  template: `
    <div class="fo-page">
      <app-page-header title="Novo Modelo de Inspeção" subtitle="Informe os dados básicos. As seções e itens são configurados na próxima etapa."></app-page-header>
      <mat-card style="padding:24px; max-width:640px">
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="fo-form-grid">
            <mat-form-field class="fo-full">
              <mat-label>Título</mat-label>
              <input matInput formControlName="title" />
              @if (form.controls.title.hasError('required') && form.controls.title.touched) {
                <mat-error>Título é obrigatório</mat-error>
              }
            </mat-form-field>
            <mat-form-field class="fo-full">
              <mat-label>Descrição</mat-label>
              <textarea matInput rows="3" formControlName="description"></textarea>
            </mat-form-field>
            <mat-form-field class="fo-full">
              <mat-label>Categoria</mat-label>
              <input matInput formControlName="category" placeholder="Ex.: Elétrica, Segurança, Estrutural" />
              @if (form.controls.category.hasError('required') && form.controls.category.touched) {
                <mat-error>Categoria é obrigatória</mat-error>
              }
            </mat-form-field>
          </div>
          @if (errorMessage()) {
            <p class="fo-dialog-error">{{ errorMessage() }}</p>
          }
          <div class="fo-actions-row">
            <button mat-button type="button" (click)="cancel()">Cancelar</button>
            <button mat-raised-button color="primary" type="submit" [disabled]="saving()">
              @if (saving()) { <mat-spinner diameter="18"></mat-spinner> } @else { Criar e continuar }
            </button>
          </div>
        </form>
      </mat-card>
    </div>
  `,
})
export class TemplateNewComponent {
  readonly saving = signal(false);
  readonly errorMessage = signal('');

  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(150)]],
    description: [''],
    category: ['', [Validators.required, Validators.maxLength(80)]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly templatesService: TemplatesService,
    private readonly router: Router,
  ) {}

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.errorMessage.set('');
    const raw = this.form.getRawValue();
    this.templatesService.create({ title: raw.title!, description: raw.description || undefined, category: raw.category! }).subscribe({
      next: (template) => {
        this.saving.set(false);
        this.router.navigate(['/app/inspection-templates', template.id, 'edit']);
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(extractErrorMessage(err));
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/app/inspection-templates']);
  }
}
