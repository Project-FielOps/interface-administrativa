import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { debounceTime } from 'rxjs';
import { AuditService } from '../audit.service';
import { AuditEvent } from '../../../core/models/inspection.model';
import { StateContainerComponent } from '../../../shared/components/state-container/state-container.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { UiState, errorState, extractErrorMessage, loadingState, successState } from '../../../shared/components/state-container/ui-state';

@Component({
  selector: 'app-audit-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatTableModule, MatFormFieldModule, MatInputModule,
    MatDatepickerModule, MatNativeDateModule, MatPaginatorModule, StateContainerComponent, PageHeaderComponent,
  ],
  templateUrl: './audit-list.component.html',
})
export class AuditListComponent implements OnInit {
  readonly displayedColumns = ['occurredAt', 'action', 'entityType', 'entityId', 'actorName'];
  readonly state = signal<UiState<AuditEvent[]>>(loadingState());
  readonly totalElements = signal(0);
  readonly pageSize = signal(20);
  readonly pageIndex = signal(0);

  readonly filterForm = this.fb.group({ entityType: [''], from: [null as Date | null], to: [null as Date | null] });

  constructor(private readonly fb: FormBuilder, private readonly service: AuditService) {}

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
        entityType: f.entityType || undefined,
        from: f.from ? new Date(f.from).toISOString() : undefined,
        to: f.to ? new Date(f.to).toISOString() : undefined,
        page: this.pageIndex(),
        size: this.pageSize(),
        sort: 'occurredAt,desc',
      })
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
}
