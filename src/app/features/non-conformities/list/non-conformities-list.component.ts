import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { debounceTime } from 'rxjs';
import { NonConformitiesService } from '../non-conformities.service';
import { NonConformity } from '../../../core/models/inspection.model';
import { StateContainerComponent } from '../../../shared/components/state-container/state-container.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { UiState, errorState, extractErrorMessage, loadingState, successState } from '../../../shared/components/state-container/ui-state';

@Component({
  selector: 'app-non-conformities-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatTableModule, MatFormFieldModule, MatSelectModule,
    MatInputModule, MatIconModule, MatButtonModule, MatExpansionModule, MatPaginatorModule,
    StateContainerComponent, PageHeaderComponent,
  ],
  templateUrl: './non-conformities-list.component.html',
})
export class NonConformitiesListComponent implements OnInit {
  readonly state = signal<UiState<NonConformity[]>>(loadingState());
  readonly totalElements = signal(0);
  readonly pageSize = signal(10);
  readonly pageIndex = signal(0);

  readonly filterForm = this.fb.group({ severity: [''], inspectionId: [''] });

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: NonConformitiesService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.load();
    this.filterForm.valueChanges.pipe(debounceTime(350)).subscribe(() => {
      this.pageIndex.set(0);
      this.load();
    });
  }

  load(): void {
    this.state.set(loadingState());
    const { severity, inspectionId } = this.filterForm.getRawValue();
    this.service
      .list({ severity: severity || undefined, inspectionId: inspectionId || undefined, page: this.pageIndex(), size: this.pageSize(), sort: 'createdAt,desc' })
      .subscribe({
        next: (page) => {
          this.totalElements.set(page.totalElements);
          this.state.set(successState(page.content, page.content.length === 0));
        },
        error: (err) => this.state.set(errorState(extractErrorMessage(err))),
      });
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  viewInspection(nc: NonConformity): void {
    this.router.navigate(['/app/inspections', nc.inspectionId]);
  }
}
