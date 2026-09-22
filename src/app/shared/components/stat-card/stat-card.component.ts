import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="card card-pad stat-card">
      <div class="flex justify-between items-center">
        <span class="stat-label">{{ label() }}</span>
        @if (icon()) {
          <mat-icon class="stat-icon" [style.color]="accent()">{{ icon() }}</mat-icon>
        }
      </div>
      <div class="stat-value">{{ value() }}</div>
      @if (hint()) {
        <div class="stat-hint text-muted">{{ hint() }}</div>
      }
    </div>
  `,
  styles: [
    `
      .stat-card { min-width: 0; }
      .stat-label {
        font-size: 12.5px;
        color: var(--color-text-muted);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.02em;
      }
      .stat-icon { font-size: 20px; width: 20px; height: 20px; }
      .stat-value {
        font-size: 26px;
        font-weight: 700;
        margin-top: 6px;
        color: var(--color-text);
      }
      .stat-hint { font-size: 12px; margin-top: 4px; }
    `,
  ],
})
export class StatCardComponent {
  label = input.required<string>();
  value = input.required<string | number>();
  hint = input<string>('');
  icon = input<string>('');
  accent = input<string>('var(--color-primary)');
}
