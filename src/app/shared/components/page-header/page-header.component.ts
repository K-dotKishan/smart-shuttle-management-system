import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div>
        <h1>{{ title() }}</h1>
        @if (subtitle()) {
          <p class="text-muted subtitle">{{ subtitle() }}</p>
        }
      </div>
      <div class="actions">
        <ng-content select="[actions]"></ng-content>
      </div>
    </div>
  `,
  styles: [
    `
      .page-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 20px;
        flex-wrap: wrap;
      }
      h1 { font-size: 20px; color: var(--color-text); }
      .subtitle { margin: 4px 0 0; font-size: 13px; }
      .actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    `,
  ],
})
export class PageHeaderComponent {
  title = input.required<string>();
  subtitle = input<string>('');
}
