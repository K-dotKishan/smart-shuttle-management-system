import { ChangeDetectionStrategy, Component, EventEmitter, input, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

interface NavItem {
  label: string;
  icon: string;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
  { label: 'Operations', icon: 'manage_accounts', path: '/operations' },
  { label: 'Drivers', icon: 'badge', path: '/drivers' },
  { label: 'Bookings', icon: 'event_seat', path: '/bookings' },
  { label: 'Routes', icon: 'alt_route', path: '/routes' },
  { label: 'Vehicles', icon: 'directions_bus', path: '/vehicles' },
  { label: 'Trip History', icon: 'history', path: '/trips' },
  { label: 'Settings', icon: 'settings', path: '/settings' },
];

@Component({
  selector: 'app-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  template: `
    <nav class="sidebar" [class.collapsed]="collapsed()" aria-label="Primary navigation">
      <div class="brand">
        <div class="brand-mark" aria-hidden="true">SC</div>
        @if (!collapsed()) {
          <span class="brand-name">Campus Shuttle</span>
        }
      </div>

      <ul class="nav-list">
        @for (item of navItems; track item.path) {
          <li>
            <a
              [routerLink]="item.path"
              routerLinkActive="active"
              [attr.aria-label]="item.label"
              (click)="navigate.emit()"
            >
              <mat-icon>{{ item.icon }}</mat-icon>
              @if (!collapsed()) {
                <span>{{ item.label }}</span>
              }
            </a>
          </li>
        }
      </ul>

      <button class="collapse-toggle" type="button" (click)="toggleCollapse.emit()" aria-label="Toggle sidebar">
        <mat-icon>{{ collapsed() ? 'chevron_right' : 'chevron_left' }}</mat-icon>
      </button>
    </nav>
  `,
  styles: [
    `
      .sidebar {
        width: var(--sidebar-width);
        background: #101828;
        color: #cbd5e1;
        display: flex;
        flex-direction: column;
        height: 100%;
        transition: width 0.15s ease;
        position: relative;
      }
      .sidebar.collapsed { width: var(--sidebar-width-collapsed); }

      .brand {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 18px 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }
      .brand-mark {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: var(--color-primary);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 13px;
        flex-shrink: 0;
      }
      .brand-name { font-weight: 700; color: #fff; font-size: 15px; white-space: nowrap; }

      .nav-list { list-style: none; margin: 8px 0; padding: 0 8px; flex: 1; overflow-y: auto; }
      .nav-list a {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        border-radius: var(--radius-md);
        color: #cbd5e1;
        font-size: 13.5px;
        font-weight: 500;
        text-decoration: none;
        margin-bottom: 2px;
      }
      .nav-list a mat-icon { font-size: 20px; width: 20px; height: 20px; flex-shrink: 0; }
      .nav-list a:hover { background: rgba(255, 255, 255, 0.06); color: #fff; }
      .nav-list a.active { background: var(--color-primary); color: #fff; }

      .collapse-toggle {
        border: none;
        background: rgba(255, 255, 255, 0.06);
        color: #cbd5e1;
        padding: 10px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .collapse-toggle:hover { background: rgba(255, 255, 255, 0.12); }

      @media (max-width: 900px) {
        .sidebar { width: 240px; }
        .sidebar.collapsed { width: 240px; }
      }
    `,
  ],
})
export class SidebarComponent {
  collapsed = input<boolean>(false);
  @Output() toggleCollapse = new EventEmitter<void>();
  @Output() navigate = new EventEmitter<void>();

  navItems = NAV_ITEMS;
}
