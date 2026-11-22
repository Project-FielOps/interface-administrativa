import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DashboardService, DashboardSummary } from '../dashboard.service';
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
import { AuthService } from '../../../core/auth/auth.service';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Rascunho',
  ASSIGNED: 'Atribuídas',
  IN_PROGRESS: 'Em andamento',
  SUBMITTED: 'Enviadas',
  UNDER_REVIEW: 'Em revisão',
  APPROVED: 'Aprovadas',
  REJECTED: 'Reprovadas',
  CANCELED: 'Canceladas',
};

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    StateContainerComponent,
    PageHeaderComponent,
  ],
  templateUrl: './dashboard-home.component.html',
})
export class DashboardHomeComponent implements OnInit {
  readonly state = signal<UiState<DashboardSummary>>(loadingState());
  readonly statusLabels = STATUS_LABELS;

  constructor(
    private readonly dashboardService: DashboardService,
    private readonly router: Router,
    readonly auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.state.set(loadingState());
    this.dashboardService.getSummary().subscribe({
      next: (summary) => this.state.set(successState(summary, false)),
      error: (err) => this.state.set(requestErrorState(err)),
    });
  }

  statusEntries(summary: DashboardSummary): { key: string; label: string; value: number }[] {
    return Object.entries(summary.inspectionsByStatus || {}).map(([key, value]) => ({
      key,
      label: this.statusLabels[key] || key,
      value,
    }));
  }

  severityEntries(summary: DashboardSummary): { key: string; value: number }[] {
    return Object.entries(summary.nonConformitiesBySeverity || {}).map(([key, value]) => ({
      key,
      value,
    }));
  }

  createInspection(): void {
    this.router.navigate(['/app/inspections/new']);
  }

  reviewPending(): void {
    this.router.navigate(['/app/inspections'], { queryParams: { awaitingReview: true } });
  }

  openStatus(status: string): void {
    this.router.navigate(['/app/inspections'], { queryParams: { status } });
  }

  openOverdue(): void {
    this.router.navigate(['/app/inspections'], { queryParams: { overdue: true } });
  }
}
