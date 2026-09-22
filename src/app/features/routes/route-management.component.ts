import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SearchBarComponent } from '../../shared/components/search-bar/search-bar.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { NotificationService, RouteService } from '../../core/services';
import { ShuttleRoute } from '../../core/models';
import { RouteFormDialogComponent } from './route-form-dialog.component';

@Component({
  selector: 'app-route-management',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent, SearchBarComponent, StatusBadgeComponent, EmptyStateComponent, MatIconModule],
  template: `
    <app-page-header title="Route Management" subtitle="Define pickup, stops and drop-off points for campus shuttle loops">
      <div actions>
        <button class="btn btn-primary" type="button" (click)="openAdd()">
          <mat-icon>add</mat-icon> Add Route
        </button>
      </div>
    </app-page-header>

    <div class="card card-pad" style="margin-bottom: 16px;">
      <app-search-bar placeholder="Search routes…" (search)="searchTerm.set($event)"></app-search-bar>
    </div>

    @if (filteredRoutes().length === 0) {
      <div class="card">
        <app-empty-state icon="alt_route" title="No routes found" description="Try a different search or add a new route."></app-empty-state>
      </div>
    } @else {
      <div class="route-grid">
        @for (route of filteredRoutes(); track route.id) {
          <div class="card card-pad route-card">
            <div class="flex justify-between items-center">
              <h3>{{ route.name }}</h3>
              <app-status-badge [status]="route.active ? 'Available' : 'Inactive'"></app-status-badge>
            </div>
            <p class="text-muted route-desc">{{ route.description }}</p>

            <div class="stop-path">
              <span class="stop">{{ route.pickupPoint }}</span>
              @for (stop of route.stops; track stop) {
                <mat-icon class="arrow">arrow_downward</mat-icon>
                <span class="stop">{{ stop }}</span>
              }
              <mat-icon class="arrow">arrow_downward</mat-icon>
              <span class="stop">{{ route.dropoffPoint }}</span>
            </div>

            <div class="flex justify-between items-center route-footer">
              <span class="text-muted"><mat-icon class="inline-icon">schedule</mat-icon> {{ route.estimatedDurationMinutes }} min</span>
              <div class="flex gap-2">
                <button class="btn" type="button" (click)="openEdit(route)">Edit</button>
                <button class="btn btn-danger" type="button" (click)="confirmDelete(route)">Delete</button>
              </div>
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [
    `
      .route-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
      .route-card h3 { font-size: 15px; }
      .route-desc { font-size: 12.5px; margin: 6px 0 12px; }
      .stop-path { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; margin-bottom: 14px; }
      .stop { font-size: 13px; font-weight: 600; color: var(--color-text); }
      .arrow { font-size: 14px; width: 14px; height: 14px; color: var(--color-text-faint); margin-left: 2px; }
      .route-footer { border-top: 1px solid var(--color-border); padding-top: 10px; font-size: 12.5px; }
      .inline-icon { font-size: 15px; width: 15px; height: 15px; vertical-align: -3px; margin-right: 2px; }
    `,
  ],
})
export class RouteManagementComponent {
  private routeService = inject(RouteService);
  private dialog = inject(MatDialog);
  private notifications = inject(NotificationService);

  searchTerm = signal('');

  filteredRoutes = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    return this.routeService.routes().filter((r) => !term || r.name.toLowerCase().includes(term));
  });

  openAdd(): void {
    const ref = this.dialog.open(RouteFormDialogComponent, { data: {}, width: '480px' });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      if (this.routeService.isDuplicateName(result.name)) {
        this.notifications.error('A route with this name already exists.');
        return;
      }
      this.routeService.add(result);
      this.notifications.success('Route added.');
    });
  }

  openEdit(route: ShuttleRoute): void {
    const ref = this.dialog.open(RouteFormDialogComponent, { data: { route }, width: '480px' });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      if (this.routeService.isDuplicateName(result.name, route.id)) {
        this.notifications.error('A route with this name already exists.');
        return;
      }
      this.routeService.update(route.id, result);
      this.notifications.success('Route updated.');
    });
  }

  confirmDelete(route: ShuttleRoute): void {
    const data: ConfirmDialogData = {
      title: 'Delete route?',
      message: `"${route.name}" will be permanently removed.`,
      confirmLabel: 'Delete',
      danger: true,
    };
    const ref = this.dialog.open(ConfirmDialogComponent, { data, width: '420px' });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.routeService.remove(route.id);
      this.notifications.success('Route deleted.');
    });
  }
}
