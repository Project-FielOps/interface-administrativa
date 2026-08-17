import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { TemplateSection } from '../../../core/models/template.model';

export interface SectionFormDialogData {
  section?: TemplateSection;
}

@Component({
  selector: 'app-section-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.section ? 'Editar Seção' : 'Nova Seção' }}</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content>
        <mat-form-field class="fo-full" style="width:100%">
          <mat-label>Título da seção</mat-label>
          <input matInput formControlName="title" />
          @if (form.controls.title.hasError('required') && form.controls.title.touched) {
            <mat-error>Título é obrigatório</mat-error>
          }
        </mat-form-field>
        <mat-form-field class="fo-full" style="width:100%">
          <mat-label>Descrição (opcional)</mat-label>
          <textarea matInput rows="2" formControlName="description"></textarea>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancelar</button>
        <button mat-raised-button color="primary" type="submit">Salvar</button>
      </mat-dialog-actions>
    </form>
  `,
})
export class SectionFormDialogComponent {
  readonly form = this.fb.group({
    title: [this.data.section?.title ?? '', [Validators.required, Validators.maxLength(150)]],
    description: [this.data.section?.description ?? ''],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<SectionFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SectionFormDialogData,
  ) {}

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close(this.form.getRawValue());
  }
}
