import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { ResponseType, TemplateItem } from '../../../core/models/template.model';

export interface ItemFormDialogData {
  item?: TemplateItem;
}

const RESPONSE_TYPES: { value: ResponseType; label: string }[] = [
  { value: 'TEXT_SHORT', label: 'Texto curto' },
  { value: 'TEXT_LONG', label: 'Texto longo' },
  { value: 'NUMBER', label: 'Número' },
  { value: 'BOOLEAN', label: 'Sim/Não' },
  { value: 'CONFORMITY', label: 'Conformidade' },
  { value: 'SINGLE_CHOICE', label: 'Escolha única' },
  { value: 'DATE', label: 'Data' },
];

@Component({
  selector: 'app-item-form-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatCheckboxModule, MatIconModule,
  ],
  templateUrl: './item-form-dialog.component.html',
})
export class ItemFormDialogComponent {
  readonly responseTypes = RESPONSE_TYPES;

  readonly form = this.fb.group({
    code: [this.data.item?.code ?? ''],
    title: [this.data.item?.title ?? '', [Validators.required, Validators.maxLength(300)]],
    description: [this.data.item?.description ?? ''],
    responseType: [this.data.item?.responseType ?? 'TEXT_SHORT', [Validators.required]],
    required: [this.data.item?.required ?? true],
    observationRequiredOnFailure: [this.data.item?.observationRequiredOnFailure ?? false],
    evidenceRequiredOnFailure: [this.data.item?.evidenceRequiredOnFailure ?? false],
    options: this.fb.array((this.data.item?.optionsJson ?? []).map((o) => this.fb.control(o, Validators.required))),
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<ItemFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ItemFormDialogData,
  ) {}

  get options(): FormArray {
    return this.form.controls.options;
  }

  get isSingleChoice(): boolean {
    return this.form.controls.responseType.value === 'SINGLE_CHOICE';
  }

  addOption(): void {
    this.options.push(this.fb.control('', Validators.required));
  }

  removeOption(index: number): void {
    this.options.removeAt(index);
  }

  submit(): void {
    if (this.form.invalid || (this.isSingleChoice && this.options.length === 0)) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    this.dialogRef.close({
      code: raw.code || undefined,
      title: raw.title,
      description: raw.description || undefined,
      responseType: raw.responseType,
      required: raw.required,
      observationRequiredOnFailure: raw.observationRequiredOnFailure,
      evidenceRequiredOnFailure: raw.evidenceRequiredOnFailure,
      optionsJson: this.isSingleChoice ? raw.options : undefined,
    });
  }
}
