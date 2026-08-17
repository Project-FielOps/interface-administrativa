import { Component, Input, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { UiPhase } from './ui-state';

/**
 * Generic wrapper reused across every data screen to render the loading /
 * error / empty / content states consistently instead of re-implementing
 * spinners and error banners in each feature component.
 */
@Component({
  selector: 'app-state-container',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatButtonModule, MatIconModule],
  templateUrl: './state-container.component.html',
  styleUrl: './state-container.component.scss',
})
export class StateContainerComponent {
  @Input() phase: UiPhase = 'loading';
  @Input() errorMessage = '';
  @Input() emptyMessage = 'Nenhum registro encontrado.';
  @Input() emptyIcon = 'inbox';
  @Input() content?: TemplateRef<unknown>;
  @Input() retry?: () => void;
}
