import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { NonConformitiesService } from '../non-conformities.service';
import { NonConformity } from '../../../core/models/inspection.model';
import { StateContainerComponent } from '../../../shared/components/state-container/state-container.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import {
  UiState,
  errorState,
  extractErrorMessage,
  loadingState,
  successState,
  requestErrorState,
} from '../../../shared/components/state-container/ui-state';

/**
 * The real backend has no flat, top-level non-conformities list — every non-conformity is
 * nested under its inspection (GET /inspections/{inspectionId}/non-conformities). This screen
 * therefore requires the user to look up a specific inspection by id, then filters the
 * returned (small, unpaginated) array by severity client-side.
 */
@Component({
  selector: 'app-non-conformities-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    StateContainerComponent,
    PageHeaderComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './non-conformities-list.component.html',
})
export class NonConformitiesListComponent {
  readonly state = signal<UiState<NonConformity[]>>({ phase: 'empty' });
  readonly displayedColumns = ['title', 'description', 'severity', 'status', 'actions'];
  readonly severityFilter = signal('');

  readonly filtered = computed(() => {
    const data = this.state().data ?? [];
    const severity = this.severityFilter();
    return severity ? data.filter((nc) => nc.severity === severity) : data;
  });
  readonly displayPhase = computed(() =>
    this.state().phase === 'success' && this.filtered().length === 0 && !!this.severityFilter()
      ? 'no-results'
      : this.state().phase,
  );

  clearFilters(): void {
    this.filterForm.patchValue({ severity: '' });
  }

  readonly filterForm = this.fb.group({ inspectionId: [''], severity: [''] });

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: NonConformitiesService,
    private readonly router: Router,
  ) {
    this.filterForm.controls.severity.valueChanges.subscribe((v) =>
      this.severityFilter.set(v || ''),
    );
  }

  search(): void {
    const { inspectionId } = this.filterForm.getRawValue();
    if (!inspectionId) return;
    this.state.set(loadingState());
    this.service.listByInspection(inspectionId).subscribe({
      next: (list) =>
        this.state.set(successState(list, list.length === 0, !!this.severityFilter())),
      error: (err) => this.state.set(requestErrorState(err)),
    });
  }

  viewInspection(nc: NonConformity): void {
    this.router.navigate(['/app/inspections', nc.inspectionId]);
  }
}
