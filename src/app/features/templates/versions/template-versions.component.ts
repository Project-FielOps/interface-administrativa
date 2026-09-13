import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TemplatesService } from '../templates.service';
import { InspectionTemplateVersion } from '../../../core/models/template.model';
import { StateContainerComponent } from '../../../shared/components/state-container/state-container.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import {
  UiState,
  errorState,
  extractErrorMessage,
  loadingState,
  successState,
} from '../../../shared/components/state-container/ui-state';

@Component({
  selector: 'app-template-versions',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    StateContainerComponent,
    PageHeaderComponent,
  ],
  templateUrl: './template-versions.component.html',
})
export class TemplateVersionsComponent implements OnInit {
  @Input() templateId!: string;

  readonly displayedColumns = [
    'versionNumber',
    'titleSnapshot',
    'publishedAt',
    'activeForNewInspections',
  ];
  readonly state = signal<UiState<InspectionTemplateVersion[]>>(loadingState());

  constructor(
    private readonly templatesService: TemplatesService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.state.set(loadingState());
    this.templatesService.getVersions(this.templateId).subscribe({
      next: (versions) => {
        const sorted = [...versions].sort((a, b) => b.versionNumber - a.versionNumber);
        this.state.set(successState(sorted, sorted.length === 0));
      },
      error: (err) => this.state.set(errorState(extractErrorMessage(err))),
    });
  }

  back(): void {
    this.router.navigate(['/app/inspection-templates', this.templateId, 'edit']);
  }
}
