import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { InspectionsService } from '../inspections.service';
import { EvidenceService } from '../../evidence/evidence.service';
import { NonConformitiesService } from '../../non-conformities/non-conformities.service';
import {
  Inspection,
  InspectionItemSnapshot,
  InspectionReview,
  Evidence,
  NonConformity,
  AuditEvent,
} from '../../../core/models/inspection.model';
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
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

interface DetailData {
  inspection: Inspection;
  reviews: InspectionReview[];
  evidence: Evidence[];
  nonConformities: NonConformity[];
  history: AuditEvent[];
}

@Component({
  selector: 'app-inspection-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    StateContainerComponent,
    PageHeaderComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './inspection-detail.component.html',
})
export class InspectionDetailComponent implements OnInit {
  @Input() inspectionId!: string;

  readonly state = signal<UiState<DetailData>>(loadingState());

  constructor(
    private readonly inspectionsService: InspectionsService,
    private readonly evidenceService: EvidenceService,
    private readonly nonConformitiesService: NonConformitiesService,
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
      inspection: this.inspectionsService.get(this.inspectionId),
      reviews: this.inspectionsService.getReviews(this.inspectionId),
      evidence: this.evidenceService.listByInspection(this.inspectionId),
      nonConformities: this.nonConformitiesService.listByInspection(this.inspectionId),
      history: this.inspectionsService.getHistory(this.inspectionId),
    }).subscribe({
      next: ({ inspection, reviews, evidence, nonConformities, history }) => {
        const sortedItems = [...(inspection.items ?? [])].sort(
          (a, b) => a.sectionOrder - b.sectionOrder || a.itemOrder - b.itemOrder,
        );
        this.state.set(
          successState(
            {
              inspection: { ...inspection, items: sortedItems },
              reviews,
              evidence,
              nonConformities,
              history,
            },
            false,
          ),
        );
      },
      error: (err) => this.state.set(requestErrorState(err)),
    });
  }

  canCancel(inspection: Inspection): boolean {
    return ['ASSIGNED', 'IN_PROGRESS', 'REJECTED'].includes(inspection.status);
  }

  canReview(inspection: Inspection): boolean {
    return inspection.status === 'SUBMITTED' || inspection.status === 'UNDER_REVIEW';
  }

  cancel(): void {
    const inspection = this.state().data?.inspection;
    if (!inspection) return;
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '460px',
      data: {
        title: 'Cancelar inspeção',
        message: `Cancelar a inspeção "${inspection.title}"?`,
        requireReason: true,
        reasonLabel: 'Motivo do cancelamento',
        confirmLabel: 'Cancelar inspeção',
        danger: true,
      },
    });
    ref.afterClosed().subscribe((reason) => {
      if (!reason) return;
      this.inspectionsService.cancel(inspection.id, reason).subscribe({
        next: () => {
          this.snackBar.open('Inspeção cancelada.', 'Fechar', { duration: 3000 });
          this.load();
        },
        error: (err) => this.snackBar.open(extractErrorMessage(err), 'Fechar', { duration: 5000 }),
      });
    });
  }

  goToReview(): void {
    this.router.navigate(['/app/inspections', this.inspectionId, 'review']);
  }

  openEvidence(evidenceId: string): void {
    this.evidenceService.downloadContent(this.inspectionId, evidenceId).subscribe({
      next: (content) => {
        const url = URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener';
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      },
      error: (err) => this.snackBar.open(extractErrorMessage(err), 'Fechar', { duration: 5000 }),
    });
  }

  back(): void {
    this.router.navigate(['/app/inspections']);
  }

  responseSummary(item: InspectionItemSnapshot): string {
    const r = item.answer;
    if (!r) return 'Sem resposta';
    if (r.valueText) return r.valueText;
    if (r.valueNumber !== undefined && r.valueNumber !== null) return String(r.valueNumber);
    if (r.valueBoolean !== undefined && r.valueBoolean !== null)
      return r.valueBoolean ? 'Sim' : 'Não';
    if (r.valueDate) return r.valueDate;
    if (r.conformity) return r.conformity;
    return 'Sem resposta';
  }
}
