import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { NonConformitiesService } from '../non-conformities.service';
import { NonConformity } from '../../../core/models/inspection.model';
import { StateContainerComponent } from '../../../shared/components/state-container/state-container.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import {
  UiState,
  loadingState,
  successState,
  requestErrorState,
} from '../../../shared/components/state-container/ui-state';

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
    MatPaginatorModule,
    StateContainerComponent,
    PageHeaderComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './non-conformities-list.component.html',
})
export class NonConformitiesListComponent implements OnInit {
  readonly state = signal<UiState<NonConformity[]>>(loadingState());
  readonly displayedColumns = ['title', 'description', 'severity', 'status', 'actions'];
  readonly totalElements = signal(0);
  readonly pageSize = signal(10);
  readonly pageIndex = signal(0);

  clearFilters(): void {
    this.filterForm.reset({ inspectionId: '', severity: '' }, { emitEvent: false });
    this.pageIndex.set(0);
    this.search();
  }

  readonly filterForm = this.fb.group({ inspectionId: [''], severity: [''] });

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: NonConformitiesService,
    private readonly router: Router,
  ) {
    this.filterForm.valueChanges.pipe(debounceTime(350), distinctUntilChanged()).subscribe(() => {
      this.pageIndex.set(0);
      if (this.canSearch()) this.search();
    });
  }

  ngOnInit(): void {
    this.search();
  }

  private canSearch(): boolean {
    const inspectionId = (this.filterForm.controls.inspectionId.value || '').trim();
    return inspectionId.length === 0 || inspectionId.length === 36;
  }

  search(): void {
    const { inspectionId, severity } = this.filterForm.getRawValue();
    if (!this.canSearch()) return;
    this.state.set(loadingState());
    this.service
      .listPage({
        inspectionId: inspectionId?.trim() || undefined,
        severity: severity || undefined,
        page: this.pageIndex(),
        size: this.pageSize(),
        sort: 'createdAt,desc',
      })
      .subscribe({
        next: (page) => {
          this.totalElements.set(page.totalElements);
          this.state.set(successState(page.content, page.content.length === 0, this.hasFilters()));
        },
        error: (err) => this.state.set(requestErrorState(err)),
      });
  }

  pageChanged(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.search();
  }

  hasFilters(): boolean {
    return (
      !!this.filterForm.controls.inspectionId.value || !!this.filterForm.controls.severity.value
    );
  }

  displayPhase(): UiState<NonConformity[]>['phase'] {
    return this.state().phase === 'success' && this.state().data?.length === 0 && this.hasFilters()
      ? 'no-results'
      : this.state().phase;
  }

  viewInspection(nc: NonConformity): void {
    this.router.navigate(['/app/inspections', nc.inspectionId]);
  }
}
