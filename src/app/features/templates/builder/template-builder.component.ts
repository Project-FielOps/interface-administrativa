import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { TemplatesService } from '../templates.service';
import { InspectionTemplate, TemplateItem, TemplateSection } from '../../../core/models/template.model';
import { StateContainerComponent } from '../../../shared/components/state-container/state-container.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { UiState, errorState, extractErrorMessage, loadingState, successState } from '../../../shared/components/state-container/ui-state';
import { SectionFormDialogComponent } from './section-form-dialog.component';
import { ItemFormDialogComponent } from './item-form-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

interface BuilderData {
  template: InspectionTemplate;
  sections: TemplateSection[];
}

@Component({
  selector: 'app-template-builder',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatChipsModule, StateContainerComponent, PageHeaderComponent,
  ],
  templateUrl: './template-builder.component.html',
})
export class TemplateBuilderComponent implements OnInit {
  @Input() templateId!: string;

  readonly state = signal<UiState<BuilderData>>(loadingState());
  readonly savingMeta = signal(false);
  readonly publishing = signal(false);

  readonly metaForm = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(150)]],
    description: [''],
    category: ['', [Validators.required, Validators.maxLength(80)]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly templatesService: TemplatesService,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.state.set(loadingState());
    forkJoin({
      template: this.templatesService.get(this.templateId),
      sections: this.templatesService.getSections(this.templateId),
    }).subscribe({
      next: ({ template, sections }) => {
        const sorted = [...sections].sort((a, b) => a.displayOrder - b.displayOrder);
        sorted.forEach((s) => s.items.sort((a, b) => a.displayOrder - b.displayOrder));
        this.metaForm.patchValue({ title: template.title, description: template.description, category: template.category });
        this.state.set(successState({ template, sections: sorted }, false));
      },
      error: (err) => this.state.set(errorState(extractErrorMessage(err))),
    });
  }

  get isDraft(): boolean {
    return this.state().data?.template.status === 'DRAFT';
  }

  saveMeta(): void {
    if (this.metaForm.invalid) {
      this.metaForm.markAllAsTouched();
      return;
    }
    const template = this.state().data?.template;
    if (!template) return;
    this.savingMeta.set(true);
    const raw = this.metaForm.getRawValue();
    this.templatesService.update(template.id, { title: raw.title!, description: raw.description || undefined, category: raw.category!, version: template.version }).subscribe({
      next: () => {
        this.savingMeta.set(false);
        this.snackBar.open('Dados do modelo atualizados.', 'Fechar', { duration: 3000 });
        this.load();
      },
      error: (err) => {
        this.savingMeta.set(false);
        this.snackBar.open(extractErrorMessage(err), 'Fechar', { duration: 5000 });
      },
    });
  }

  addSection(): void {
    const ref = this.dialog.open(SectionFormDialogComponent, { width: '480px', data: {} });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      const nextOrder = (this.state().data?.sections.length ?? 0) + 1;
      this.templatesService.createSection(this.templateId, { title: result.title, description: result.description, displayOrder: nextOrder }).subscribe({
        next: () => this.load(),
        error: (err) => this.snackBar.open(extractErrorMessage(err), 'Fechar', { duration: 5000 }),
      });
    });
  }

  editSection(section: TemplateSection): void {
    const ref = this.dialog.open(SectionFormDialogComponent, { width: '480px', data: { section } });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.templatesService.updateSection(this.templateId, section.id, { title: result.title, description: result.description, displayOrder: section.displayOrder }).subscribe({
        next: () => this.load(),
        error: (err) => this.snackBar.open(extractErrorMessage(err), 'Fechar', { duration: 5000 }),
      });
    });
  }

  deleteSection(section: TemplateSection): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: { title: 'Remover seção', message: `Remover a seção "${section.title}" e todos os seus itens?`, danger: true },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.templatesService.deleteSection(this.templateId, section.id).subscribe({
        next: () => this.load(),
        error: (err) => this.snackBar.open(extractErrorMessage(err), 'Fechar', { duration: 5000 }),
      });
    });
  }

  moveSection(sections: TemplateSection[], index: number, direction: -1 | 1): void {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    const reordered = [...sections];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    this.templatesService.reorderSections(this.templateId, reordered.map((s) => s.id)).subscribe({
      next: () => this.load(),
      error: (err) => this.snackBar.open(extractErrorMessage(err), 'Fechar', { duration: 5000 }),
    });
  }

  addItem(section: TemplateSection): void {
    const ref = this.dialog.open(ItemFormDialogComponent, { width: '600px', data: {} });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      const nextOrder = section.items.length + 1;
      this.templatesService.createItem(this.templateId, section.id, { ...result, displayOrder: nextOrder }).subscribe({
        next: () => this.load(),
        error: (err) => this.snackBar.open(extractErrorMessage(err), 'Fechar', { duration: 5000 }),
      });
    });
  }

  editItem(section: TemplateSection, item: TemplateItem): void {
    const ref = this.dialog.open(ItemFormDialogComponent, { width: '600px', data: { item } });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.templatesService.updateItem(this.templateId, section.id, item.id, { ...result, displayOrder: item.displayOrder }).subscribe({
        next: () => this.load(),
        error: (err) => this.snackBar.open(extractErrorMessage(err), 'Fechar', { duration: 5000 }),
      });
    });
  }

  deleteItem(section: TemplateSection, item: TemplateItem): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: { title: 'Remover item', message: `Remover o item "${item.title}"?`, danger: true },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.templatesService.deleteItem(this.templateId, section.id, item.id).subscribe({
        next: () => this.load(),
        error: (err) => this.snackBar.open(extractErrorMessage(err), 'Fechar', { duration: 5000 }),
      });
    });
  }

  moveItem(section: TemplateSection, index: number, direction: -1 | 1): void {
    const target = index + direction;
    if (target < 0 || target >= section.items.length) return;
    const reordered = [...section.items];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    this.templatesService.reorderItems(this.templateId, section.id, reordered.map((i) => i.id)).subscribe({
      next: () => this.load(),
      error: (err) => this.snackBar.open(extractErrorMessage(err), 'Fechar', { duration: 5000 }),
    });
  }

  publish(): void {
    const data = this.state().data;
    if (!data) return;
    if (data.sections.length === 0) {
      this.snackBar.open('Adicione ao menos uma seção com itens antes de publicar.', 'Fechar', { duration: 5000 });
      return;
    }
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '480px',
      data: {
        title: 'Publicar modelo',
        message: 'Publicar cria uma nova versão imutável do modelo, disponível para novos agendamentos. Deseja continuar?',
        confirmLabel: 'Publicar',
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.publishing.set(true);
      this.templatesService.publish(this.templateId).subscribe({
        next: () => {
          this.publishing.set(false);
          this.snackBar.open('Modelo publicado com sucesso.', 'Fechar', { duration: 4000 });
          this.load();
        },
        error: (err) => {
          this.publishing.set(false);
          this.snackBar.open(extractErrorMessage(err), 'Fechar', { duration: 6000 });
        },
      });
    });
  }

  goToPreview(): void {
    this.router.navigate(['/app/inspection-templates', this.templateId, 'preview']);
  }

  goToVersions(): void {
    this.router.navigate(['/app/inspection-templates', this.templateId, 'versions']);
  }

  back(): void {
    this.router.navigate(['/app/inspection-templates']);
  }
}
