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
import { forkJoin } from 'rxjs';
import { InspectionsService } from '../inspections.service';
import {
  Evidence,
  Inspection,
  InspectionItemSnapshot,
  InspectionReview,
  NonConformity,
} from '../../../core/models/inspection.model';
import { NonConformitiesService } from '../../non-conformities/non-conformities.service';
import { EvidenceService } from '../../evidence/evidence.service';
import { StateContainerComponent } from '../../../shared/components/state-container/state-container.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import {
  UiState,
  errorState,
  extractErrorMessage,
  loadingState,
  successState,
} from '../../../shared/components/state-container/ui-state';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

interface ReviewData {
  inspection: Inspection;
  items: InspectionItemSnapshot[];
  reviews: InspectionReview[];
  nonConformities: NonConformity[];
  evidence: Evidence[];
}

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

  readonly state = signal<UiState<ReviewData>>(loadingState());
  readonly submittingDecision = signal(false);
  readonly startingReview = signal(false);

  readonly rejectForm = this.fb.group({
    reason: ['', [Validators.required]],
    comments: [''],
  });
  readonly showRejectForm = signal(false);

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
    this.state.set(loadingState());
    forkJoin({
      inspection: this.inspectionsService.get(this.inspectionId),
      reviews: this.inspectionsService.getReviews(this.inspectionId),
      nonConformities: this.nonConformitiesService.listByInspection(this.inspectionId),
      evidence: this.evidenceService.listByInspection(this.inspectionId),
    }).subscribe({
      next: ({ inspection, reviews, nonConformities, evidence }) => {
        const sortedItems = [...(inspection.items ?? [])].sort(
          (a, b) => a.sectionOrder - b.sectionOrder || a.itemOrder - b.itemOrder,
        );
        this.state.set(
          successState(
            { inspection, items: sortedItems, reviews, nonConformities, evidence },
            false,
          ),
        );
      },
      error: (err) => this.state.set(errorState(extractErrorMessage(err))),
    });
  }

  /** Only SUBMITTED inspections need an explicit begin-review call before a decision can be made. */
  get needsBeginReview(): boolean {
    return this.state().data?.inspection.status === 'SUBMITTED';
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
    const answerId = item.answer?.id;
    if (!answerId) return [];
    return (this.state().data?.evidence ?? []).filter((e) => e.responseId === answerId);
  }

  beginReview(): void {
    this.startingReview.set(true);
    this.inspectionsService.beginReview(this.inspectionId).subscribe({
      next: () => {
        this.startingReview.set(false);
        this.load();
      },
      error: (err) => {
        this.startingReview.set(false);
        this.snackBar.open(extractErrorMessage(err), 'Fechar', { duration: 6000 });
      },
    });
  }

  approve(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '460px',
      data: {
        title: 'Aprovar inspeção',
        message: 'Confirma a aprovação desta inspeção?',
        confirmLabel: 'Aprovar',
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.submittingDecision.set(true);
      this.inspectionsService.approve(this.inspectionId).subscribe({
        next: () => {
          this.submittingDecision.set(false);
          this.snackBar.open('Inspeção aprovada.', 'Fechar', { duration: 4000 });
          this.router.navigate(['/app/inspections', this.inspectionId]);
        },
        error: (err) => {
          this.submittingDecision.set(false);
          this.snackBar.open(extractErrorMessage(err), 'Fechar', { duration: 6000 });
        },
      });
    });
  }

  toggleRejectForm(): void {
    this.showRejectForm.set(!this.showRejectForm());
  }

  submitReject(): void {
    if (this.rejectForm.invalid) {
      this.rejectForm.markAllAsTouched();
      return;
    }
    const { reason, comments } = this.rejectForm.getRawValue();
    this.submittingDecision.set(true);
    this.inspectionsService.reject(this.inspectionId, reason!, comments || undefined).subscribe({
      next: () => {
        this.submittingDecision.set(false);
        this.snackBar.open('Inspeção reprovada.', 'Fechar', { duration: 4000 });
        this.router.navigate(['/app/inspections', this.inspectionId]);
      },
      error: (err) => {
        this.submittingDecision.set(false);
        this.snackBar.open(extractErrorMessage(err), 'Fechar', { duration: 6000 });
      },
    });
  }

  back(): void {
    this.router.navigate(['/app/inspections', this.inspectionId]);
  }
}
