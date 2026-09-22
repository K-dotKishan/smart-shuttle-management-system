import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';

@Component({
  selector: 'app-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatMenuModule, MatButtonModule, MatBadgeModule],
  template: `
    <header class="app-header">
      <button class="icon-btn hide-desktop" type="button" (click)="menuClick.emit()" aria-label="Open navigation">
        <mat-icon>menu</mat-icon>
      </button>

      <div class="header-title">
        <h2>Smart Campus Shuttle Management</h2>
      </div>

      <div class="header-right">
        <button class="icon-btn" type="button" aria-label="Notifications" matBadge="3" matBadgeSize="small" matBadgeColor="warn">
          <mat-icon>notifications</mat-icon>
        </button>

        <button class="admin-chip" type="button" [matMenuTriggerFor]="adminMenu" aria-label="Admin account menu">
          <span class="avatar">AD</span>
          <span class="admin-info hide-mobile">
            <strong>Admin User</strong>
            <small>Campus Operations</small>
          </span>
          <mat-icon class="hide-mobile">expand_more</mat-icon>
        </button>
        <mat-menu #adminMenu="matMenu">
          <button mat-menu-item disabled>Signed in as Admin</button>
          <button mat-menu-item>
            <mat-icon>person</mat-icon>
            <span>Profile</span>
          </button>
          <button mat-menu-item>
            <mat-icon>logout</mat-icon>
            <span>Sign out</span>
          </button>
        </mat-menu>
      </div>
    </header>
  `,
  styles: [
    `
      .app-header {
        height: var(--header-height);
        background: var(--color-surface);
        border-bottom: 1px solid var(--color-border);
        display: flex;
        align-items: center;
        padding: 0 24px;
        gap: 14px;
        flex-shrink: 0;
        box-shadow: 0 1px 0 var(--color-border);
      }
      .header-title { flex: 1; min-width: 0; }
      .header-title h2 {
        font-size: 14.5px;
        font-weight: 700;
        color: var(--color-text);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        letter-spacing: -0.01em;
      }
      .header-right { display: flex; align-items: center; gap: 8px; }

      .icon-btn {
        border: none;
        background: transparent;
        width: 36px;
        height: 36px;
        border-radius: 9px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: var(--color-text-muted);
        transition: background var(--transition-fast), color var(--transition-fast);
      }
      .icon-btn:hover { background: var(--color-bg); color: var(--color-text); }

      .admin-chip {
        display: flex;
        align-items: center;
        gap: 9px;
        border: 1px solid var(--color-border);
        background: var(--color-surface);
        border-radius: 999px;
        padding: 4px 12px 4px 4px;
        cursor: pointer;
        transition: background var(--transition-fast), box-shadow var(--transition-fast);
        box-shadow: var(--shadow-xs);
      }
      .admin-chip:hover { background: var(--color-bg); box-shadow: var(--shadow-sm); }

      .avatar {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
        color: #fff;
        font-size: 11.5px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 6px var(--color-primary-glow);
      }

      .admin-info { display: flex; flex-direction: column; line-height: 1.25; text-align: left; }
      .admin-info strong { font-size: 12.5px; font-weight: 600; color: var(--color-text); }
      .admin-info small { font-size: 11px; color: var(--color-text-muted); }

      .hide-desktop { display: none; }
      @media (max-width: 900px) {
        .hide-desktop { display: flex; }
        .hide-mobile { display: none; }
        .header-title h2 { font-size: 13px; }
        .app-header { padding: 0 16px; }
      }
    `,
  ],
})
export class HeaderComponent {
  @Output() menuClick = new EventEmitter<void>();
}
