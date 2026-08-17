import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { InspectionsService } from '../inspections.service';
import { Inspection, InspectionItemSnapshot, InspectionReview, NonConformity } from '../../../core/models/inspection.model';
import { NonConformitiesService } from '../../non-conformities/non-conformities.service';
import { StateContainerComponent } from '../../../shared/components/state-container/state-container.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { UiState, errorState, extractErrorMessage, loadingState, successState } from '../../../shared/components/state-container/ui-state';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

interface ReviewData {
  inspection: Inspection;
  items: InspectionItemSnapshot[];
  reviews: InspectionReview[];
  nonConformities: NonConformity[];
}

@Component({
  selector: 'app-inspection-review',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, StateContainerComponent, PageHeaderComponent],
  templateUrl: './inspection-review.component.html',
})
export class InspectionReviewComponent implements OnInit {
  @Input() inspectionId!: string;

  readonly state = signal<UiState<ReviewData>>(loadingState());
  readonly submittingDecision = signal(false);

  constructor(
    private readonly inspectionsService: InspectionsService,
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
      items: this.inspectionsService.getItems(this.inspectionId),
      reviews: this.inspectionsService.getReviews(this.inspectionId),
      nonConformities: this.nonConformitiesService.list({ inspectionId: this.inspectionId, size: 100 }),
    }).subscribe({
      next: ({ inspection, items, reviews, nonConformities }) => {
        const sortedItems = [...items].sort((a, b) => a.sectionOrder - b.sectionOrder || a.itemOrder - b.itemOrder);
        this.state.set(successState({ inspection, items: sortedItems, reviews, nonConformities: nonConformities.content }, false));
      },
      error: (err) => this.state.set(errorState(extractErrorMessage(err))),
    });
  }

  responseSummary(item: InspectionItemSnapshot): string {
    const r = item.response;
    if (!r) return 'Sem resposta';
    if (r.valueText) return r.valueText;
    if (r.valueNumber !== undefined && r.valueNumber !== null) return String(r.valueNumber);
    if (r.valueBoolean !== undefined && r.valueBoolean !== null) return r.valueBoolean ? 'Sim' : 'Não';
    if (r.valueDate) return r.valueDate;
    if (r.conformity) return r.conformity;
    return 'Sem resposta';
  }

  approve(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '460px',
      data: { title: 'Aprovar inspeção', message: 'Confirma a aprovação desta inspeção?', confirmLabel: 'Aprovar' },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.decide('APPROVED');
    });
  }

  reject(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '460px',
      data: {
        title: 'Reprovar inspeção',
        message: 'A reprovação exige um motivo, que será enviado ao técnico para correção.',
        requireReason: true,
        reasonLabel: 'Motivo da reprovação',
        confirmLabel: 'Reprovar',
        danger: true,
      },
    });
    ref.afterClosed().subscribe((reason) => {
      if (!reason) return;
      this.decide('REJECTED', reason);
    });
  }

  private decide(decision: 'APPROVED' | 'REJECTED', reason?: string): void {
    this.submittingDecision.set(true);
    this.inspectionsService.review(this.inspectionId, { decision, reason }).subscribe({
      next: () => {
        this.submittingDecision.set(false);
        this.snackBar.open(decision === 'APPROVED' ? 'Inspeção aprovada.' : 'Inspeção reprovada.', 'Fechar', { duration: 4000 });
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
