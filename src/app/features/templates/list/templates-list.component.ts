import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime } from 'rxjs';
import { TemplatesService } from '../templates.service';
import { InspectionTemplate } from '../../../core/models/template.model';
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
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-templates-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatPaginatorModule,
    StateContainerComponent,
    PageHeaderComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './templates-list.component.html',
})
export class TemplatesListComponent implements OnInit {
  readonly displayedColumns = ['title', 'category', 'status', 'currentVersion', 'actions'];
  readonly state = signal<UiState<InspectionTemplate[]>>(loadingState());
  readonly totalElements = signal(0);
  readonly pageSize = signal(10);
  readonly pageIndex = signal(0);
  readonly categories = signal<string[]>([]);

  readonly filterForm = this.fb.group({ status: [''], category: [''] });

  constructor(
    private readonly fb: FormBuilder,
    private readonly templatesService: TemplatesService,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.load();
    this.filterForm.valueChanges.pipe(debounceTime(350)).subscribe(() => {
      this.pageIndex.set(0);
      this.load();
    });
  }

  load(): void {
    this.state.set(loadingState());
    const { status, category } = this.filterForm.getRawValue();
    this.templatesService
      .list({
        status: status || undefined,
        category: category || undefined,
        page: this.pageIndex(),
        size: this.pageSize(),
        sort: 'title,asc',
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

  clearFilters(): void {
    this.filterForm.reset({ status: '', category: '' });
  }

  private loadCategories(): void {
    this.templatesService.listCategories().subscribe({
      next: (categories) => this.categories.set(categories),
    });
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  create(): void {
    this.router.navigate(['/app/inspection-templates/new']);
  }

  edit(t: InspectionTemplate): void {
    this.router.navigate(['/app/inspection-templates', t.id, 'edit']);
  }

  preview(t: InspectionTemplate): void {
    this.router.navigate(['/app/inspection-templates', t.id, 'preview']);
  }

  versions(t: InspectionTemplate): void {
    this.router.navigate(['/app/inspection-templates', t.id, 'versions']);
  }

  inactivate(t: InspectionTemplate): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Inativar modelo',
        message: `Inativar o modelo "${t.title}"? Ele deixará de estar disponível para novos agendamentos.`,
        danger: true,
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.templatesService.updateStatus(t.id, 'INACTIVE').subscribe({
        next: () => {
          this.snackBar.open('Modelo inativado.', 'Fechar', { duration: 3000 });
          this.load();
        },
        error: (err) => this.snackBar.open(extractErrorMessage(err), 'Fechar', { duration: 5000 }),
      });
    });
  }
}
