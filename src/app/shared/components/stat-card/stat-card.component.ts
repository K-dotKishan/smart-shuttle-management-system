import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

const CARD_THEMES: Record<string, { gradient: string; iconBg: string; iconColor: string; glow: string }> = {
  blue:    { gradient: 'linear-gradient(135deg,#4361ee 0%,#2d46c7 100%)', iconBg: 'rgba(255,255,255,0.22)', iconColor: '#fff', glow: 'rgba(67,97,238,0.30)' },
  emerald: { gradient: 'linear-gradient(135deg,#059669 0%,#047857 100%)', iconBg: 'rgba(255,255,255,0.22)', iconColor: '#fff', glow: 'rgba(5,150,105,0.28)' },
  amber:   { gradient: 'linear-gradient(135deg,#f59e0b 0%,#d97706 100%)', iconBg: 'rgba(255,255,255,0.22)', iconColor: '#fff', glow: 'rgba(245,158,11,0.28)' },
  violet:  { gradient: 'linear-gradient(135deg,#7c3aed 0%,#5b21b6 100%)', iconBg: 'rgba(255,255,255,0.22)', iconColor: '#fff', glow: 'rgba(124,58,237,0.28)' },
  teal:    { gradient: 'linear-gradient(135deg,#0d9488 0%,#0f766e 100%)', iconBg: 'rgba(255,255,255,0.22)', iconColor: '#fff', glow: 'rgba(13,148,136,0.28)' },
  rose:    { gradient: 'linear-gradient(135deg,#e11d48 0%,#be123c 100%)', iconBg: 'rgba(255,255,255,0.22)', iconColor: '#fff', glow: 'rgba(225,29,72,0.28)' },
  sky:     { gradient: 'linear-gradient(135deg,#0284c7 0%,#0369a1 100%)', iconBg: 'rgba(255,255,255,0.22)', iconColor: '#fff', glow: 'rgba(2,132,199,0.28)' },
};

@Component({
  selector: 'app-stat-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="stat-card" [style.background]="theme().gradient" [style.box-shadow]="'0 4px 20px ' + theme().glow">
      <div class="stat-top">
        <div class="stat-icon-wrap" [style.background]="theme().iconBg">
          @if (icon()) {
            <mat-icon [style.color]="theme().iconColor">{{ icon() }}</mat-icon>
          }
        </div>
        <div class="stat-badge">
          <span class="stat-value">{{ value() }}</span>
        </div>
      </div>
      <div class="stat-label">{{ label() }}</div>
      @if (hint()) {
        <div class="stat-hint">{{ hint() }}</div>
      }
    </div>
  `,
  styles: [`
    .stat-card {
      border-radius: var(--radius-lg);
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      cursor: default;
      position: relative;
      overflow: hidden;
      transition: transform var(--transition-base), box-shadow var(--transition-base);
      animation: fadeUp 0.3s both;
      border: none;
    }
    .stat-card::after {
      content: '';
      position: absolute;
      top: -30px;
      right: -30px;
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: rgba(255,255,255,0.08);
      pointer-events: none;
    }
    .stat-card:hover {
      transform: translateY(-3px) scale(1.01);
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .stat-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
    }
    .stat-icon-wrap {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      backdrop-filter: blur(4px);
    }
    .stat-icon-wrap mat-icon { font-size: 22px; width: 22px; height: 22px; }
    .stat-badge {
      display: flex;
      align-items: center;
    }
    .stat-value {
      font-size: 32px;
      font-weight: 800;
      color: #fff;
      line-height: 1;
      letter-spacing: -0.04em;
      text-shadow: 0 1px 4px rgba(0,0,0,0.15);
    }
    .stat-label {
      font-size: 12px;
      font-weight: 700;
      color: rgba(255,255,255,0.82);
      text-transform: uppercase;
      letter-spacing: 0.07em;
    }
    .stat-hint {
      font-size: 11.5px;
      color: rgba(255,255,255,0.65);
    }
  `],
})
export class StatCardComponent {
  label = input.required<string>();
  value = input.required<string | number>();
  hint = input<string>('');
  icon = input<string>('');
  accent = input<string>('blue');
  colorTheme = input<string>('blue');

  theme() {
    // Allow passing color theme name or derive from accent
    const t = this.colorTheme();
    if (CARD_THEMES[t]) return CARD_THEMES[t];
    const a = this.accent();
    if (a.includes('059669') || a.includes('0f7b') || a.includes('17824f')) return CARD_THEMES['emerald'];
    if (a.includes('d977') || a.includes('9a52') || a.includes('a15c')) return CARD_THEMES['amber'];
    if (a.includes('7c3a') || a.includes('8b5c')) return CARD_THEMES['violet'];
    if (a.includes('e11d') || a.includes('be2c') || a.includes('b3261e')) return CARD_THEMES['rose'];
    if (a.includes('0284') || a.includes('0ea5')) return CARD_THEMES['sky'];
    if (a.includes('0d94') || a.includes('0f76')) return CARD_THEMES['teal'];
    return CARD_THEMES['blue'];
  }
}
