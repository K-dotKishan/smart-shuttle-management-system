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
        padding: 0 20px;
        gap: 12px;
        flex-shrink: 0;
      }
      .header-title { flex: 1; min-width: 0; }
      .header-title h2 { font-size: 15px; font-weight: 600; color: var(--color-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .header-right { display: flex; align-items: center; gap: 10px; }
      .icon-btn {
        border: none;
        background: transparent;
        width: 36px;
        height: 36px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: var(--color-text-muted);
      }
      .icon-btn:hover { background: var(--color-bg); }
      .admin-chip {
        display: flex;
        align-items: center;
        gap: 8px;
        border: 1px solid var(--color-border);
        background: var(--color-surface);
        border-radius: 999px;
        padding: 4px 10px 4px 4px;
        cursor: pointer;
      }
      .admin-chip:hover { background: var(--color-bg); }
      .avatar {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: var(--color-primary-light);
        color: var(--color-primary-dark);
        font-size: 12px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .admin-info { display: flex; flex-direction: column; line-height: 1.2; text-align: left; }
      .admin-info strong { font-size: 12.5px; }
      .admin-info small { font-size: 11px; color: var(--color-text-muted); }

      .hide-desktop { display: none; }
      @media (max-width: 900px) {
        .hide-desktop { display: flex; }
        .hide-mobile { display: none; }
        .header-title h2 { font-size: 13.5px; }
      }
    `,
  ],
})
export class HeaderComponent {
  @Output() menuClick = new EventEmitter<void>();
}
