import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fo-page-header">
      <div>
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
    .fo-page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    h1 { margin: 0 0 4px; font-size: 22px; font-weight: 500; }
    .fo-page-header__subtitle { margin: 0; color: #666; font-size: 14px; }
    .fo-page-header__actions { display: flex; gap: 8px; flex-wrap: wrap; }
  `],
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
}
