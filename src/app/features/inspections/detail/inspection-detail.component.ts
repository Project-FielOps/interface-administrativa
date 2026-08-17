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
import { Inspection, InspectionItemSnapshot, InspectionReview } from '../../../core/models/inspection.model';
import { StateContainerComponent } from '../../../shared/components/state-container/state-container.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { UiState, errorState, extractErrorMessage, loadingState, successState } from '../../../shared/components/state-container/ui-state';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

interface DetailData {
  inspection: Inspection;
  reviews: InspectionReview[];
}

@Component({
  selector: 'app-inspection-detail',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, StateContainerComponent, PageHeaderComponent],
  templateUrl: './inspection-detail.component.html',
})
export class InspectionDetailComponent implements OnInit {
  @Input() inspectionId!: string;

  readonly state = signal<UiState<DetailData>>(loadingState());

  constructor(
    private readonly inspectionsService: InspectionsService,
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
    }).subscribe({
      next: ({ inspection, reviews }) => {
        const sortedItems = [...(inspection.items ?? [])].sort((a, b) => a.sectionOrder - b.sectionOrder || a.itemOrder - b.itemOrder);
        this.state.set(successState({ inspection: { ...inspection, items: sortedItems }, reviews }, false));
      },
      error: (err) => this.state.set(errorState(extractErrorMessage(err))),
    });
  }

  canCancel(inspection: Inspection): boolean {
    return !['APPROVED', 'REJECTED', 'CANCELED'].includes(inspection.status);
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

  back(): void {
    this.router.navigate(['/app/inspections']);
  }

  responseSummary(item: InspectionItemSnapshot): string {
    const r = item.answer;
    if (!r) return 'Sem resposta';
    if (r.valueText) return r.valueText;
    if (r.valueNumber !== undefined && r.valueNumber !== null) return String(r.valueNumber);
    if (r.valueBoolean !== undefined && r.valueBoolean !== null) return r.valueBoolean ? 'Sim' : 'Não';
    if (r.valueDate) return r.valueDate;
    if (r.conformity) return r.conformity;
    return 'Sem resposta';
  }
}
