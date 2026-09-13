import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="fo-page-header">
      <div>
        <h1>{{ title }}</h1>
        @if (subtitle) {
          <p class="fo-page-header__subtitle">{{ subtitle }}</p>
        }
      </div>
      <div class="fo-page-header__actions">
        <ng-content></ng-content>
      </div>
    </header>
  `,
  styles: [
    `
      .fo-page-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 24px;
        margin-bottom: 24px;
        flex-wrap: wrap;
      }
      h1 {
        margin: 0 0 4px;
        font-size: 28px;
        line-height: 36px;
        font-weight: 800;
        letter-spacing: -0.02em;
      }
      .fo-page-header__subtitle {
        max-width: 720px;
        margin: 0;
        color: var(--fo-text-secondary);
        font-size: 14px;
      }
      .fo-page-header__actions {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      @media (max-width: 760px) {
        .fo-page-header {
          flex-direction: column;
        }
        .fo-page-header__actions {
          width: 100%;
        }
      }
    `,
  ],
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
}
