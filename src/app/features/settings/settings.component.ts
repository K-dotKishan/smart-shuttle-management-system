import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { NotificationService } from '../../core/services';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent, MatIconModule],
  template: `
    <app-page-header title="Settings" subtitle="Admin profile and application preferences"></app-page-header>

    <div class="grid">
      <section class="card card-pad">
        <h3>Admin profile</h3>
        <p class="text-muted" style="margin-top: 4px;">
          This app uses a mock admin identity for demonstration — there is no backend authentication.
        </p>
        <div class="profile-row">
          <span class="avatar">AD</span>
          <div>
            <strong>Admin User</strong>
            <div class="text-muted">Campus Operations · admin&#64;campus.edu</div>
          </div>
        </div>
        <ul class="permissions">
          <li><mat-icon>check_circle</mat-icon> Manage drivers, vehicles &amp; routes</li>
          <li><mat-icon>check_circle</mat-icon> Manage and assign bookings</li>
          <li><mat-icon>check_circle</mat-icon> View demand dashboard &amp; trip history</li>
        </ul>
      </section>

      <section class="card card-pad">
        <h3>About this application</h3>
        <p class="text-muted" style="margin-top: 4px;">
          Smart Campus Shuttle Management System — a frontend-only implementation. All data is
          generated as mock seed data and persisted to your browser's local storage; there is no
          server or database. Clearing site data will reset the app back to its seeded state.
        </p>
        <button class="btn btn-danger" type="button" (click)="resetData()">
          <mat-icon>restart_alt</mat-icon>
          Reset application data
        </button>
      </section>
    </div>
  `,
  styles: [
    `
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 16px;
      }
      h3 { font-size: 15px; }
      .profile-row { display: flex; align-items: center; gap: 12px; margin: 16px 0; }
      .avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: var(--color-primary-light);
        color: var(--color-primary-dark);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
      }
      .permissions { list-style: none; padding: 0; margin: 12px 0 0; display: flex; flex-direction: column; gap: 8px; }
      .permissions li { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--color-text); }
      .permissions mat-icon { font-size: 18px; width: 18px; height: 18px; color: var(--color-success); }
      .btn { margin-top: 14px; }
    `,
  ],
})
export class SettingsComponent {
  private notifications = inject(NotificationService);

  resetData(): void {
    if (confirm('This clears all locally stored data and reloads the app with fresh seed data. Continue?')) {
      localStorage.clear();
      this.notifications.info('Application data reset. Reloading…');
      setTimeout(() => window.location.reload(), 600);
    }
  }
}
