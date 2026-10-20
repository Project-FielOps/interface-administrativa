import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatRadioModule } from '@angular/material/radio';
import { forkJoin } from 'rxjs';
import { TemplatesService } from '../templates.service';
import { InspectionTemplate, TemplateSection } from '../../../core/models/template.model';
import { StateContainerComponent } from '../../../shared/components/state-container/state-container.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import {
  UiState,
  errorState,
  extractErrorMessage,
  loadingState,
  successState,
} from '../../../shared/components/state-container/ui-state';

interface PreviewData {
  template: InspectionTemplate;
  sections: TemplateSection[];
}

@Component({
  selector: 'app-template-preview',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatRadioModule,
    StateContainerComponent,
    PageHeaderComponent,
  ],
  templateUrl: './template-preview.component.html',
})
export class TemplatePreviewComponent implements OnInit {
  @Input() templateId!: string;

  readonly state = signal<UiState<PreviewData>>(loadingState());

  constructor(
    private readonly templatesService: TemplatesService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.state.set(loadingState());
    forkJoin({
      template: this.templatesService.get(this.templateId),
      draft: this.templatesService.getDraft(this.templateId),
    }).subscribe({
      next: ({ template, draft }) => {
        const sections = draft.sections;
        const sorted = [...sections].sort((a, b) => a.displayOrder - b.displayOrder);
        sorted.forEach((s) => s.items.sort((a, b) => a.displayOrder - b.displayOrder));
        this.state.set(successState({ template, sections: sorted }, false));
      },
      error: (err) => this.state.set(errorState(extractErrorMessage(err))),
    });
  }

  back(): void {
    this.router.navigate(['/app/inspection-templates', this.templateId, 'edit']);
  }

  /** optionsJson travels the wire as a JSON-encoded string, e.g. '["A","B"]'. */
  parseOptions(optionsJson?: string): string[] {
    if (!optionsJson) return [];
    try {
      const parsed = JSON.parse(optionsJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}
