import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fo-page-header">
      <div class="fo-page-header__heading">
        @if (eyebrow) {
          <span class="fo-page-header__eyebrow">{{ eyebrow }}</span>
        }
        <h1>{{ title }}</h1>
        @if (subtitle) {
          <p class="fo-page-header__subtitle">{{ subtitle }}</p>
        }
      </div>
      <div class="fo-page-header__actions">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    /* Cabeçalho de página no Precision System: Jakarta no título,
       divisor de 1px separando o cabeçalho do conteúdo. */
    .fo-page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--fo-space-md, 16px);
      margin-bottom: var(--fo-space-lg, 24px);
      padding-bottom: var(--fo-space-md, 16px);
      border-bottom: 1px solid var(--fo-hairline, #e2e8f0);
      flex-wrap: wrap;
    }

    .fo-page-header__heading {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .fo-page-header__eyebrow {
      font: var(--fo-label-caps, 600 12px/16px Inter);
      letter-spacing: var(--fo-tracking-caps, 0.05em);
      text-transform: uppercase;
      color: var(--mat-sys-on-surface-variant, #434655);
      opacity: 0.75;
      margin-bottom: var(--fo-space-base, 4px);
    }

    h1 {
      margin: 0;
      font: var(--fo-headline-md, 600 24px/32px 'Plus Jakarta Sans');
      letter-spacing: -0.02em;
      color: var(--mat-sys-on-surface, #191b23);
    }

    .fo-page-header__subtitle {
      margin: var(--fo-space-base, 4px) 0 0;
      font: var(--fo-body-md, 400 14px/20px Inter);
      color: var(--mat-sys-on-surface-variant, #434655);
      max-width: 68ch;
    }

    .fo-page-header__actions {
      display: flex;
      gap: var(--fo-space-xs, 8px);
      flex-wrap: wrap;
      align-items: center;
    }
  `],
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
  /** Rótulo curto acima do título (opcional), em label-caps. */
  @Input() eyebrow = '';
}
