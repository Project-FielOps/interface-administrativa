import { Component, Input, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InspectionsService } from '../inspections.service';
import { EvidenceService } from '../../evidence/evidence.service';
import { NonConformitiesService } from '../../non-conformities/non-conformities.service';
import {
  Inspection,
  InspectionAnswer,
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
  loadingState,
  successState,
  requestErrorState,
  extractErrorMessage,
} from '../../../shared/components/state-container/ui-state';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

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
export class InspectionDetailComponent implements OnInit, OnDestroy {
  @Input() inspectionId!: string;

  readonly inspectionState = signal<UiState<Inspection>>(loadingState());
  readonly responsesState = signal<UiState<InspectionAnswer[]>>(loadingState());
  readonly reviewsState = signal<UiState<InspectionReview[]>>(loadingState());
  readonly evidenceState = signal<UiState<Evidence[]>>(loadingState());
  readonly nonConformitiesState = signal<UiState<NonConformity[]>>(loadingState());
  readonly historyState = signal<UiState<AuditEvent[]>>(loadingState());
  readonly contentLoading = signal<string | null>(null);
  private readonly objectUrls = new Set<string>();

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

  ngOnDestroy(): void {
    this.objectUrls.forEach((url) => URL.revokeObjectURL(url));
    this.objectUrls.clear();
  }

  load(): void {
    this.inspectionState.set(loadingState());
    this.responsesState.set(loadingState());
    this.reviewsState.set(loadingState());
    this.evidenceState.set(loadingState());
    this.nonConformitiesState.set(loadingState());
    this.historyState.set(loadingState());

    this.inspectionsService.get(this.inspectionId).subscribe({
      next: (inspection) =>
        this.inspectionState.set(successState(this.sortedInspection(inspection), false)),
      error: (err) => this.inspectionState.set(requestErrorState(err)),
    });
    this.inspectionsService.getResponses(this.inspectionId).subscribe({
      next: (responses) => {
        this.responsesState.set(successState(responses, responses.length === 0));
        this.mergeResponses(responses);
      },
      error: (err) => this.responsesState.set(requestErrorState(err)),
    });
    this.inspectionsService.getReviews(this.inspectionId).subscribe({
      next: (reviews) => this.reviewsState.set(successState(reviews, reviews.length === 0)),
      error: (err) => this.reviewsState.set(requestErrorState(err)),
    });
    this.evidenceService.listByInspection(this.inspectionId).subscribe({
      next: (evidence) => this.evidenceState.set(successState(evidence, evidence.length === 0)),
      error: (err) => this.evidenceState.set(requestErrorState(err)),
    });
    this.nonConformitiesService.listByInspection(this.inspectionId).subscribe({
      next: (items) => this.nonConformitiesState.set(successState(items, items.length === 0)),
      error: (err) => this.nonConformitiesState.set(requestErrorState(err)),
    });
    this.inspectionsService.getHistory(this.inspectionId).subscribe({
      next: (history) => this.historyState.set(successState(history, history.length === 0)),
      error: (err) => this.historyState.set(requestErrorState(err)),
    });
  }

  retryResponses(): void {
    this.responsesState.set(loadingState());
    this.inspectionsService.getResponses(this.inspectionId).subscribe({
      next: (responses) => {
        this.responsesState.set(successState(responses, responses.length === 0));
        this.mergeResponses(responses);
      },
      error: (err) => this.responsesState.set(requestErrorState(err)),
    });
  }

  private sortedInspection(inspection: Inspection): Inspection {
    return {
      ...inspection,
      items: [...(inspection.items ?? [])].sort(
        (a, b) => a.sectionOrder - b.sectionOrder || a.itemOrder - b.itemOrder,
      ),
    };
  }

  private mergeResponses(responses: InspectionAnswer[]): void {
    const inspection = this.inspectionState().data;
    if (!inspection?.items) return;
    const byItem = new Map(responses.map((response) => [response.inspectionItemId, response]));
    const items = inspection.items.map((item) => ({
      ...item,
      answer: byItem.get(item.id) ?? item.answer ?? null,
    }));
    this.inspectionState.set(successState({ ...inspection, items }, false));
  }

  canCancel(inspection: Inspection): boolean {
    return (
      !this.isReadOnly(inspection) &&
      ['ASSIGNED', 'IN_PROGRESS', 'REJECTED'].includes(inspection.status)
    );
  }

  canReview(inspection: Inspection): boolean {
    return (
      !this.isReadOnly(inspection) && ['SUBMITTED', 'UNDER_REVIEW'].includes(inspection.status)
    );
  }

  isReadOnly(inspection: Inspection): boolean {
    return inspection.status === 'APPROVED' || inspection.status === 'CANCELED';
  }

  cancel(): void {
    const inspection = this.inspectionState().data;
    if (!inspection || !this.canCancel(inspection)) return;
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
        error: (err) => this.showActionError(err),
      });
    });
  }

  goToReview(): void {
    const inspection = this.inspectionState().data;
    if (inspection && this.canReview(inspection)) {
      this.router.navigate(['/app/inspections', this.inspectionId, 'review']);
    }
  }

  previewEvidence(evidence: Evidence): void {
    this.openEvidence(evidence, false);
  }

  downloadEvidence(evidence: Evidence): void {
    this.openEvidence(evidence, true);
  }

  private openEvidence(evidence: Evidence, download: boolean): void {
    this.contentLoading.set(evidence.id);
    this.evidenceService.downloadContent(this.inspectionId, evidence.id).subscribe({
      next: (content) => {
        this.contentLoading.set(null);
        const mimeType = evidence.mimeType || content.type;
        const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
        this.objectUrls.add(url);
        const link = document.createElement('a');
        link.href = url;
        link.rel = 'noopener';
        if (download) {
          link.download = evidence.originalFileName || 'evidencia';
        } else {
          link.target = '_blank';
        }
        link.click();
        window.setTimeout(() => {
          URL.revokeObjectURL(url);
          this.objectUrls.delete(url);
        }, 30_000);
      },
      error: (err) => {
        this.contentLoading.set(null);
        this.showActionError(err);
      },
    });
  }

  showActionError(err: unknown): void {
    this.snackBar.open(extractErrorMessage(err), 'Fechar', { duration: 6000 });
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

  evidenceLabel(evidence: Evidence): string {
    return evidence.mimeType === 'application/pdf' ? 'Abrir PDF' : 'Visualizar';
  }
}
