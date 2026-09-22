import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="stat-card">
      <div class="stat-top">
        <span class="stat-label">{{ label() }}</span>
        @if (icon()) {
          <div class="stat-icon-wrap" [style.background]="iconBg()">
            <mat-icon [style.color]="accent()">{{ icon() }}</mat-icon>
          </div>
        }
      </div>
      <div class="stat-value">{{ value() }}</div>
      @if (hint()) {
        <div class="stat-hint">{{ hint() }}</div>
      }
    </div>
  `,
  styles: [`
    .stat-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 20px;
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      gap: 6px;
      transition: box-shadow var(--transition-base), transform var(--transition-base);
      cursor: default;
    }
    .stat-card:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(-1px);
    }
    .stat-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .stat-label {
      font-size: 11.5px;
      font-weight: 700;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .stat-icon-wrap {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .stat-icon-wrap mat-icon { font-size: 19px; width: 19px; height: 19px; }
    .stat-value {
      font-size: 28px;
      font-weight: 800;
      color: var(--color-text);
      line-height: 1;
      letter-spacing: -0.03em;
      margin-top: 2px;
    }
    .stat-hint {
      font-size: 11.5px;
      color: var(--color-text-faint);
      margin-top: 2px;
    }
  `],
})
export class StatCardComponent {
  label = input.required<string>();
  value = input.required<string | number>();
  hint = input<string>('');
  icon = input<string>('');
  accent = input<string>('var(--color-primary)');

  iconBg() {
    const a = this.accent();
    // derive a soft background from the accent
    if (a === 'var(--color-primary)' || a === '#3b6ef0' || a === '#2f5fdb') return 'var(--color-primary-light)';
    if (a.includes('#178') || a.includes('17824f') || a.includes('0f7b')) return 'var(--color-success-bg)';
    if (a.includes('#a15') || a.includes('9a52')) return 'var(--color-warning-bg)';
    if (a.includes('#b32') || a.includes('be2c') || a.includes('b3261e')) return 'var(--color-danger-bg)';
    return 'var(--color-primary-light)';
  }
}
