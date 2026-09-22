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
        <li>
          <div class="nav-divider"></div>
          <a
            href="/api-docs.html"
            target="_blank"
            rel="noopener"
            [attr.aria-label]="'API Documentation'"
            class="api-docs-link"
          >
            <mat-icon>api</mat-icon>
            @if (!collapsed()) {
              <span>API Docs</span>
              <mat-icon class="ext-icon">open_in_new</mat-icon>
            }
          </a>
        </li>
      </ul>

      <button class="collapse-toggle" type="button" (click)="toggleCollapse.emit()" aria-label="Toggle sidebar">
        <mat-icon>{{ collapsed() ? 'chevron_right' : 'chevron_left' }}</mat-icon>
      </button>    </nav>
  `,
  styles: [
    `
      .sidebar {
        width: var(--sidebar-width);
        background: linear-gradient(180deg, #0a1628 0%, #0e1f40 60%, #13264e 100%);
        color: #94a3b8;
        display: flex;
        flex-direction: column;
        height: 100%;
        transition: width 0.2s cubic-bezier(.4,0,.2,1);
        position: relative;
        border-right: 1px solid rgba(255,255,255,0.04);
      }
      .sidebar.collapsed { width: var(--sidebar-width-collapsed); }

      .brand {
        display: flex;
        align-items: center;
        gap: 11px;
        padding: 20px 16px 18px;
        border-bottom: 1px solid rgba(255,255,255,0.06);
      }
      .brand-mark {
        width: 36px;
        height: 36px;
        border-radius: 11px;
        background: linear-gradient(135deg, #4361ee 0%, #7c3aed 100%);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 13px;
        flex-shrink: 0;
        box-shadow: 0 4px 14px rgba(67,97,238,0.5);
      }
      .brand-name {
        font-weight: 800;
        color: #fff;
        font-size: 14.5px;
        white-space: nowrap;
        letter-spacing: -0.025em;
      }

      .nav-list {
        list-style: none;
        margin: 8px 0 0;
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
        border-radius: 10px;
        color: rgba(148,163,184,0.85);
        font-size: 13.5px;
        font-weight: 500;
        text-decoration: none;
        margin-bottom: 2px;
        transition: background var(--transition-fast), color var(--transition-fast), transform var(--transition-fast);
        position: relative;
      }
      .nav-list a mat-icon {
        font-size: 19px;
        width: 19px;
        height: 19px;
        flex-shrink: 0;
        transition: color var(--transition-fast), transform var(--transition-fast);
      }
      .nav-list a:hover {
        background: rgba(255,255,255,0.07);
        color: #e2e8f0;
        transform: translateX(2px);
      }
      .nav-list a:hover mat-icon { color: #a5b4fc; transform: scale(1.1); }
      .nav-list a.active {
        background: linear-gradient(135deg, rgba(67,97,238,0.35) 0%, rgba(124,58,237,0.2) 100%);
        color: #fff;
        font-weight: 600;
        box-shadow: inset 0 0 0 1px rgba(67,97,238,0.3);
      }
      .nav-list a.active mat-icon { color: #a5b4fc; }
      .nav-list a.active::before {
        content: '';
        position: absolute;
        left: 0; top: 20%; height: 60%;
        width: 3px;
        background: linear-gradient(180deg, #4361ee, #7c3aed);
        border-radius: 0 3px 3px 0;
      }

      .nav-divider {
        height: 1px;
        background: rgba(255,255,255,0.05);
        margin: 8px 10px;
      }

      .api-docs-link {
        color: rgba(167,139,250,0.8) !important;
      }
      .api-docs-link:hover { color: #c4b5fd !important; }
      .api-docs-link mat-icon:first-child { color: #a78bfa; }
      .ext-icon { font-size: 13px !important; width: 13px !important; height: 13px !important; margin-left: auto; opacity: 0.6; }

      .collapse-toggle {
        border: none;
        background: rgba(255,255,255,0.04);
        color: #64748b;
        padding: 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background var(--transition-fast), color var(--transition-fast);
        border-top: 1px solid rgba(255,255,255,0.05);
      }
      .collapse-toggle:hover { background: rgba(255,255,255,0.09); color: #94a3b8; }

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
