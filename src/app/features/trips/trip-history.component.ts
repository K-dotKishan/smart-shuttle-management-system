import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SearchBarComponent } from '../../shared/components/search-bar/search-bar.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { DriverService, RouteService, TripService } from '../../core/services';
import { isoToDisplay } from '../../core/services/time.util';
import { Trip } from '../../core/models';

@Component({
  selector: 'app-trip-history',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent, SearchBarComponent, StatusBadgeComponent, EmptyStateComponent],
  template: `
    <app-page-header title="Trip History" subtitle="Completed, cancelled and no-show trips across the campus"></app-page-header>

    <div class="card">
      <div class="toolbar">
        <app-search-bar placeholder="Search trip ID or employee…" (search)="tripService.searchTerm.set($event)"></app-search-bar>
        <div class="filters">
          <input type="date" class="select" (change)="onDate($event)" aria-label="Filter by date" />
          <select class="select" (change)="onDriver($event)" aria-label="Filter by driver">
            <option value="All">All drivers</option>
            @for (d of driverService.activeDrivers(); track d.id) { <option [value]="d.id">{{ d.name }}</option> }
          </select>
          <select class="select" (change)="onRoute($event)" aria-label="Filter by route">
            <option value="All">All routes</option>
            @for (r of routeService.routes(); track r.id) { <option [value]="r.id">{{ r.name }}</option> }
          </select>
          <select class="select" (change)="onStatus($event)" aria-label="Filter by status">
            <option value="All">All statuses</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="No Show">No Show</option>
          </select>
        </div>
      </div>

      @if (tripService.filteredTrips().length === 0) {
        <app-empty-state icon="history" title="No trips found" description="Try adjusting your filters."></app-empty-state>
      } @else {
        <div class="scroll-x">
          <table class="data-table">
            <thead>
              <tr>
                <th>Trip ID</th>
                <th>Date</th>
                <th>Employee</th>
                <th>Route</th>
                <th>Driver</th>
                <th>Vehicle</th>
                <th>Pickup</th>
                <th>Drop</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              @for (t of tripService.filteredTrips(); track t.id) {
                <tr>
                  <td>{{ t.id }}</td>
                  <td>{{ isoToDisplay(t.date) }}</td>
                  <td>{{ t.employeeName }}</td>
                  <td>{{ t.routeName }}</td>
                  <td>{{ t.driverName }}</td>
                  <td>{{ t.vehicleNumber }}</td>
                  <td>{{ t.pickupTime }}</td>
                  <td>{{ t.dropTime }}</td>
                  <td><app-status-badge [status]="t.status"></app-status-badge></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 16px; flex-wrap: wrap; }
      .filters { display: flex; gap: 8px; flex-wrap: wrap; }
      .select { border: 1px solid var(--color-border-strong); border-radius: var(--radius-md); padding: 7px 10px; font-size: 12.5px; background: var(--color-surface); color: var(--color-text); }
    `,
  ],
})
export class TripHistoryComponent {
  tripService = inject(TripService);
  driverService = inject(DriverService);
  routeService = inject(RouteService);

  isoToDisplay = isoToDisplay;

  onDate(e: Event): void {
    const v = (e.target as HTMLInputElement).value;
    this.tripService.dateFilter.set(v || 'All');
  }
  onDriver(e: Event): void {
    this.tripService.driverFilter.set((e.target as HTMLSelectElement).value);
  }
  onRoute(e: Event): void {
    this.tripService.routeFilter.set((e.target as HTMLSelectElement).value);
  }
  onStatus(e: Event): void {
    this.tripService.statusFilter.set((e.target as HTMLSelectElement).value as Trip['status'] | 'All');
  }
}
