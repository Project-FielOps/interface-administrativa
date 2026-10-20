import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
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
  NonConformity,
  Evidence,
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
  selector: 'app-inspection-review',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    StateContainerComponent,
    PageHeaderComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './inspection-review.component.html',
})
export class InspectionReviewComponent implements OnInit {
  @Input() inspectionId!: string;
  readonly inspectionState = signal<UiState<Inspection>>(loadingState());
  readonly responsesState = signal<UiState<InspectionAnswer[]>>(loadingState());
  readonly reviewsState = signal<UiState<InspectionReview[]>>(loadingState());
  readonly nonConformitiesState = signal<UiState<NonConformity[]>>(loadingState());
  readonly evidenceState = signal<UiState<Evidence[]>>(loadingState());
  readonly historyState = signal<UiState<AuditEvent[]>>(loadingState());
  readonly submittingDecision = signal(false);
  readonly startingReview = signal(false);
  readonly showRejectForm = signal(false);
  readonly rejectForm = this.fb.group({ reason: ['', [Validators.required]], comments: [''] });

  constructor(
    private readonly fb: FormBuilder,
    private readonly inspectionsService: InspectionsService,
    private readonly nonConformitiesService: NonConformitiesService,
    private readonly evidenceService: EvidenceService,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.inspectionState.set(loadingState());
    this.responsesState.set(loadingState());
    this.reviewsState.set(loadingState());
    this.nonConformitiesState.set(loadingState());
    this.evidenceState.set(loadingState());
    this.historyState.set(loadingState());
    this.inspectionsService.get(this.inspectionId).subscribe({
      next: (inspection) => {
        this.inspectionState.set(successState(this.sortedInspection(inspection), false));
      },
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
    this.nonConformitiesService.listByInspection(this.inspectionId).subscribe({
      next: (items) => this.nonConformitiesState.set(successState(items, items.length === 0)),
      error: (err) => this.nonConformitiesState.set(requestErrorState(err)),
    });
    this.evidenceService.listByInspection(this.inspectionId).subscribe({
      next: (items) => this.evidenceState.set(successState(items, items.length === 0)),
      error: (err) => this.evidenceState.set(requestErrorState(err)),
    });
    this.inspectionsService.getHistory(this.inspectionId).subscribe({
      next: (items) => this.historyState.set(successState(items, items.length === 0)),
      error: (err) => this.historyState.set(requestErrorState(err)),
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
    this.inspectionState.set(
      successState(
        {
          ...inspection,
          items: inspection.items.map((item) => ({
            ...item,
            answer: byItem.get(item.id) ?? item.answer ?? null,
          })),
        },
        false,
      ),
    );
  }
  get needsBeginReview(): boolean {
    return this.inspectionState().data?.status === 'SUBMITTED';
  }
  get canDecide(): boolean {
    return this.inspectionState().data?.status === 'UNDER_REVIEW' && !this.submittingDecision();
  }
  get isReadOnly(): boolean {
    const status = this.inspectionState().data?.status;
    return status === 'APPROVED' || status === 'CANCELED';
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
  evidenceFor(item: InspectionItemSnapshot): Evidence[] {
    const id = item.answer?.id;
    return id ? (this.evidenceState().data ?? []).filter((e) => e.responseId === id) : [];
  }
  beginReview(): void {
    if (!this.needsBeginReview || this.startingReview()) return;
    this.startingReview.set(true);
    this.inspectionsService.beginReview(this.inspectionId).subscribe({
      next: () => {
        this.startingReview.set(false);
        this.load();
      },
      error: (err) => {
        this.startingReview.set(false);
        this.showError(err);
      },
    });
  }
  approve(): void {
    if (!this.canDecide) return;
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '460px',
      data: {
        title: 'Aprovar inspeção',
        message: 'Confirma a aprovação desta inspeção?',
        confirmLabel: 'Aprovar',
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed || !this.canDecide) return;
      this.submittingDecision.set(true);
      this.inspectionsService.approve(this.inspectionId).subscribe({
        next: () => {
          this.submittingDecision.set(false);
          this.snackBar.open('Inspeção aprovada.', 'Fechar', { duration: 4000 });
          this.load();
        },
        error: (err) => {
          this.submittingDecision.set(false);
          this.showError(err);
        },
      });
    });
  }
  toggleRejectForm(): void {
    if (this.canDecide) this.showRejectForm.set(!this.showRejectForm());
  }
  submitReject(): void {
    if (!this.canDecide) return;
    if (this.rejectForm.invalid) {
      this.rejectForm.markAllAsTouched();
      return;
    }
    const { reason, comments } = this.rejectForm.getRawValue();
    this.submittingDecision.set(true);
    this.inspectionsService
      .reject(this.inspectionId, reason!.trim(), comments || undefined)
      .subscribe({
        next: () => {
          this.submittingDecision.set(false);
          this.snackBar.open('Inspeção reprovada.', 'Fechar', { duration: 4000 });
          this.load();
        },
        error: (err) => {
          this.submittingDecision.set(false);
          this.showError(err);
        },
      });
  }
  showError(err: unknown): void {
    this.snackBar.open(extractErrorMessage(err), 'Fechar', { duration: 6000 });
  }
  back(): void {
    this.router.navigate(['/app/inspections', this.inspectionId]);
  }
}
