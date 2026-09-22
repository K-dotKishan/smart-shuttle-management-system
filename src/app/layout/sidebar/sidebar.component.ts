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
  { label: 'Employee Journeys', icon: 'directions', path: '/bookings' },
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
        background: linear-gradient(180deg, #0d1b35 0%, #111f3e 100%);
        color: #94a3b8;
        display: flex;
        flex-direction: column;
        height: 100%;
        transition: width 0.18s cubic-bezier(.4,0,.2,1);
        position: relative;
        border-right: 1px solid rgba(255,255,255,0.05);
      }
      .sidebar.collapsed { width: var(--sidebar-width-collapsed); }

      .brand {
        display: flex;
        align-items: center;
        gap: 11px;
        padding: 20px 16px 16px;
        border-bottom: 1px solid rgba(255,255,255,0.07);
      }
      .brand-mark {
        width: 34px;
        height: 34px;
        border-radius: 10px;
        background: linear-gradient(135deg, #3b6ef0 0%, #2550c4 100%);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 13px;
        flex-shrink: 0;
        box-shadow: 0 4px 10px rgba(59,110,240,0.4);
      }
      .brand-name {
        font-weight: 800;
        color: #fff;
        font-size: 14.5px;
        white-space: nowrap;
        letter-spacing: -0.02em;
      }

      .nav-section-label {
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: rgba(255,255,255,0.25);
        padding: 12px 20px 4px;
      }
      .collapsed .nav-section-label { display: none; }

      .nav-list {
        list-style: none;
        margin: 6px 0 0;
        padding: 0 10px;
        flex: 1;
        overflow-y: auto;
        scrollbar-width: none;
      }
      .nav-list::-webkit-scrollbar { display: none; }

      .nav-list a {
        display: flex;
        align-items: center;
        gap: 11px;
        padding: 10px 12px;
        border-radius: 9px;
        color: #94a3b8;
        font-size: 13.5px;
        font-weight: 500;
        text-decoration: none;
        margin-bottom: 2px;
        transition: background var(--transition-fast), color var(--transition-fast);
        position: relative;
      }
      .nav-list a mat-icon {
        font-size: 19px;
        width: 19px;
        height: 19px;
        flex-shrink: 0;
        opacity: 0.75;
        transition: opacity var(--transition-fast);
      }
      .nav-list a:hover {
        background: rgba(255,255,255,0.07);
        color: #e2e8f0;
      }
      .nav-list a:hover mat-icon { opacity: 1; }
      .nav-list a.active {
        background: linear-gradient(135deg, rgba(59,110,240,0.3) 0%, rgba(59,110,240,0.15) 100%);
        color: #fff;
        font-weight: 600;
      }
      .nav-list a.active mat-icon { opacity: 1; color: #7ba8ff; }
      .nav-list a.active::before {
        content: '';
        position: absolute;
        left: 0;
        top: 25%;
        height: 50%;
        width: 3px;
        background: var(--color-primary);
        border-radius: 0 3px 3px 0;
      }

      .nav-divider {
        height: 1px;
        background: rgba(255,255,255,0.06);
        margin: 8px 10px;
      }

      .collapse-toggle {
        border: none;
        background: rgba(255,255,255,0.05);
        color: #64748b;
        padding: 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background var(--transition-fast), color var(--transition-fast);
      }
      .collapse-toggle:hover { background: rgba(255,255,255,0.1); color: #94a3b8; }

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
