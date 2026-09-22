import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { BookingService, DriverService, VehicleService, TripService } from '../../core/services';
import { todayIso } from '../../core/services/time.util';

const DEMAND_HOURS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent, StatCardComponent, StatusBadgeComponent, EmptyStateComponent, RouterLink],
  template: `
    <app-page-header title="Dashboard" subtitle="Live overview of today's campus shuttle operations"></app-page-header>

    <div class="stat-grid">
      <app-stat-card label="Today's Trips"      [value]="todaysTrips()"      icon="route"          colorTheme="blue"    hint="Bookings scheduled today"></app-stat-card>
      <app-stat-card label="Completed"          [value]="completedTrips()"   icon="task_alt"       colorTheme="emerald" hint="Successfully dropped"></app-stat-card>
      <app-stat-card label="Active Trips"       [value]="activeTrips()"      icon="directions_bus"  colorTheme="amber"   hint="On going / accepted"></app-stat-card>
      <app-stat-card label="Available Drivers"  [value]="availableDrivers()" icon="badge"           colorTheme="violet"  hint="Online and on duty"></app-stat-card>
      <app-stat-card label="Total Bookings"     [value]="totalBookings()"    icon="event_seat"      colorTheme="teal"    hint="All statuses, today"></app-stat-card>
      <app-stat-card label="No Shows"           [value]="noShows()"          icon="report"          colorTheme="rose"    hint="Riders who did not board"></app-stat-card>
    </div>

    <div class="grid-2">
      <section class="card card-pad">
        <div class="section-hd">
          <h3>Shuttle Demand by Hour</h3>
          <span class="badge badge-info">Peak: {{ peakHourLabel() }}</span>
        </div>
        <div
          class="chart"
          role="img"
          aria-label="Bar chart of shuttle demand by hour"
        >
          @for (bar of demandBars(); track bar.hour) {
            <div class="chart-col">
              <div
                class="chart-bar"
                [class.peak]="bar.isPeak"
                [style.height.%]="bar.heightPct"
                [title]="bar.hourLabel + ' — ' + bar.count + ' trips'"
              ></div>
              <span class="chart-label">{{ bar.hourLabel }}</span>
            </div>
          }
        </div>
      </section>

      <section class="card card-pad">
        <div class="section-hd">
          <h3>Driver Availability</h3>
          <span class="text-muted" style="font-size:12px;">Today</span>
        </div>
        <div class="driver-list">
          @for (driver of driverAvailability(); track driver.id) {
            <div class="driver-row">
              <span class="avatar">{{ driver.photoInitials }}</span>
              <div class="driver-info">
                <strong>{{ driver.name }}</strong>
                <span class="text-muted">{{ dutyLabel(driver.dutyStatus) }}</span>
              </div>
              <app-status-badge [status]="driver.online ? 'Online' : 'Offline'"></app-status-badge>
            </div>
          } @empty {
            <app-empty-state icon="badge" title="No driver data" description="Add drivers to see availability."></app-empty-state>
          }
        </div>
      </section>
    </div>

    <section class="card" style="margin-top: 16px;">
      <div class="section-hd card-pad" style="margin-bottom:0; padding-bottom: 0;">
        <h3>Recent Bookings</h3>
        <a class="view-link" routerLink="/bookings">View all journeys →</a>
      </div>
      <div class="scroll-x">
        <table class="data-table">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Employee</th>
              <th>Status</th>
              <th>From</th>
              <th>To</th>
              <th>Pickup</th>
            </tr>
          </thead>
          <tbody>
            @for (b of recentBookings(); track b.id) {
              <tr>
                <td class="booking-id-cell">{{ b.id }}</td>
                <td>{{ b.employeeName }}</td>
                <td><app-status-badge [status]="b.status"></app-status-badge></td>
                <td>{{ b.fromLocation }}</td>
                <td>{{ b.toLocation }}</td>
                <td>{{ b.requestedPickupTime }}</td>
              </tr>
            } @empty {
              <tr><td colspan="6">
                <app-empty-state icon="event_busy" title="No recent bookings"></app-empty-state>
              </td></tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
  styles: [
    `
      .stat-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(175px, 1fr));
        gap: 16px;
        margin-bottom: 20px;
      }
      .grid-2 {
        display: grid;
        grid-template-columns: 1.5fr 1fr;
        gap: 16px;
      }
      @media (max-width: 1024px) { .grid-2 { grid-template-columns: 1fr; } }

      /* Section headers */
      .section-hd {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
      .section-hd h3 { font-size: 14px; font-weight: 700; }

      /* Chart */
      .chart-wrap { position: relative; }
      .chart {
        display: flex;
        align-items: flex-end;
        gap: 6px;
        height: 160px;
        padding: 8px 0 0;
      }
      .chart-col {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-end;
        height: 100%;
        position: relative;
      }
      .chart-bar {
        width: 100%;
        max-width: 22px;
        background: var(--color-primary-light);
        border-radius: 5px 5px 0 0;
        min-height: 4px;
        transition: height 0.25s cubic-bezier(.4,0,.2,1), background 0.25s;
      }
      .chart-bar:hover { filter: brightness(0.93); }
      .chart-bar.peak {
        background: linear-gradient(180deg, #5b86f5 0%, var(--color-primary) 100%);
        box-shadow: 0 -2px 8px rgba(59,110,240,0.25);
      }
      .chart-label {
        font-size: 9.5px;
        color: var(--color-text-faint);
        margin-top: 5px;
        writing-mode: vertical-rl;
        transform: rotate(180deg);
        user-select: none;
      }

      /* Driver availability */
      .driver-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
        max-height: 230px;
        overflow-y: auto;
        scrollbar-width: thin;
      }
      .driver-row {
        display: flex;
        align-items: center;
        gap: 11px;
        padding: 8px 10px;
        border-radius: var(--radius-md);
        transition: background var(--transition-fast);
      }
      .driver-row:hover { background: var(--color-bg); }
      .driver-info { flex: 1; display: flex; flex-direction: column; gap: 1px; }
      .driver-info strong { font-size: 13px; font-weight: 600; }
      .driver-info .text-muted { font-size: 11.5px; }
      .avatar {
        width: 32px; height: 32px; border-radius: 50%;
        background: linear-gradient(135deg, var(--color-primary-light) 0%, #d0dcfd 100%);
        color: var(--color-primary-dark);
        display: flex; align-items: center; justify-content: center;
        font-size: 11px; font-weight: 700; flex-shrink: 0;
        border: 1.5px solid rgba(59,110,240,0.15);
      }

      /* Recent bookings section */
      .booking-id-cell { font-weight: 600; color: var(--color-primary); font-size: 12.5px; }
      .view-link {
        font-size: 12.5px;
        color: var(--color-primary);
        font-weight: 600;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 2px;
        opacity: 0.85;
      }
      .view-link:hover { opacity: 1; text-decoration: none; }
    `,
  ],
})
export class DashboardComponent {
  private bookingService = inject(BookingService);
  private driverService = inject(DriverService);
  private vehicleService = inject(VehicleService);
  private tripService = inject(TripService);

  todaysTrips = computed(() => this.bookingService.todayCount());
  completedTrips = computed(() => this.bookingService.completedCount());
  activeTrips = computed(() => this.bookingService.activeCount());
  noShows = computed(() => this.bookingService.noShowCount());
  totalBookings = computed(() => this.bookingService.bookings().length);
  availableDrivers = computed(() => this.driverService.availableNowCount());

  driverAvailability = computed(() => this.driverService.activeDrivers().slice(0, 8));
  recentBookings = computed(() =>
    [...this.bookingService.bookings()]
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, 6)
  );

  demandBars = computed(() => {
    const today = todayIso();
    const events = this.driverService.events().filter((e) => e.date === today && (e.type === 'pickup' || e.type === 'drop'));
    const bookingHourCounts = new Map<number, number>();
    DEMAND_HOURS.forEach((h) => bookingHourCounts.set(h, 0));

    events.forEach((e) => {
      const hour = Math.floor(e.startMinutes / 60);
      if (bookingHourCounts.has(hour)) {
        bookingHourCounts.set(hour, (bookingHourCounts.get(hour) ?? 0) + 1);
      }
    });

    // Blend in booking requested-pickup times so the chart also reflects Booking Management state.
    this.bookingService.bookings().forEach((b) => {
      const hour = Number(b.requestedPickupTime.split(':')[0]);
      if (bookingHourCounts.has(hour)) {
        bookingHourCounts.set(hour, (bookingHourCounts.get(hour) ?? 0) + 1);
      }
    });

    const max = Math.max(...bookingHourCounts.values(), 1);
    return DEMAND_HOURS.map((hour) => {
      const count = bookingHourCounts.get(hour) ?? 0;
      return {
        hour,
        hourLabel: `${String(hour).padStart(2, '0')}:00`,
        count,
        heightPct: Math.max((count / max) * 100, 4),
        isPeak: count === max && max > 0,
      };
    });
  });

  peakHourLabel = computed(() => {
    const bars = this.demandBars();
    const peak = bars.find((b) => b.isPeak);
    return peak ? peak.hourLabel : '—';
  });

  dutyLabel(status: string): string {
    return status
      .split('-')
      .map((p) => p[0].toUpperCase() + p.slice(1))
      .join(' ');
  }
}
