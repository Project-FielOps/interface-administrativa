import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { debounceTime } from 'rxjs';
import { AuditService } from '../audit.service';
import { AuditEvent } from '../../../core/models/inspection.model';
import { StateContainerComponent } from '../../../shared/components/state-container/state-container.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import {
  UiState,
  errorState,
  extractErrorMessage,
  loadingState,
  successState,
  requestErrorState,
} from '../../../shared/components/state-container/ui-state';

@Component({
  selector: 'app-audit-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    MatIconModule,
    StateContainerComponent,
    PageHeaderComponent,
  ],
  templateUrl: './audit-list.component.html',
})
export class AuditListComponent implements OnInit {
  readonly displayedColumns = ['occurredAt', 'action', 'entityType', 'entityId', 'actorName'];
  readonly state = signal<UiState<AuditEvent[]>>(loadingState());
  readonly totalElements = signal(0);
  readonly pageSize = signal(20);
  readonly pageIndex = signal(0);
  readonly actionOptions = [
    'EVIDENCE_ADDED',
    'EVIDENCE_REMOVED',
    'INSPECTION_APPROVED',
    'INSPECTION_ASSIGNED',
    'INSPECTION_CANCELED',
    'INSPECTION_CREATED',
    'INSPECTION_REJECTED',
    'INSPECTION_REOPENED_FOR_CORRECTION',
    'INSPECTION_STARTED',
    'INSPECTION_SUBMITTED',
    'NON_CONFORMITY_CREATED',
    'NON_CONFORMITY_STATUS_CHANGED',
    'RESPONSE_CREATED',
    'RESPONSE_UPDATED',
    'REVIEW_STARTED',
    'TEMPLATE_CREATED',
    'TEMPLATE_VERSION_PUBLISHED',
  ];
  readonly entityTypeOptions = [
    'Evidence',
    'Inspection',
    'InspectionResponse',
    'InspectionTemplate',
    'InspectionTemplateVersion',
    'NonConformity',
  ];

  readonly filterForm = this.fb.group({
    action: [''],
    entityType: [''],
    entityId: [''],
    actorId: [''],
    occurredFrom: [''],
    occurredTo: [''],
  });

  clearFilters(): void {
    this.filterForm.reset({
      action: '',
      entityType: '',
      entityId: '',
      actorId: '',
      occurredFrom: '',
      occurredTo: '',
    });
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: AuditService,
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
    const f = this.filterForm.getRawValue();
    this.service
      .list({
        action: f.action || undefined,
        entityType: f.entityType || undefined,
        entityId: f.entityId || undefined,
        actorId: f.actorId || undefined,
        occurredFrom: f.occurredFrom || undefined,
        occurredTo: f.occurredTo || undefined,
        page: this.pageIndex(),
        size: this.pageSize(),
        sort: 'occurredAt,desc',
      })
      .subscribe({
        next: (page) => {
          this.totalElements.set(page.totalElements);
          this.state.set(
            successState(
              page.content,
              page.content.length === 0,
              Object.values(this.filterForm.getRawValue()).some(Boolean),
            ),
          );
        },
        error: (err) => this.state.set(requestErrorState(err)),
      });
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }
}
