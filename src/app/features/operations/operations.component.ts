import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SearchBarComponent } from '../../shared/components/search-bar/search-bar.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { TimelineEventComponent } from '../../shared/components/timeline-event/timeline-event.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  BookingService,
  DriverService,
  NotificationService,
  RouteService,
  TripService,
  VehicleService,
} from '../../core/services';
import { todayIso } from '../../core/services/time.util';
import { Booking, BookingStatus, Driver, DriverScheduleEvent } from '../../core/models';
import { DriverFormDialogComponent } from '../drivers/components/driver-form-dialog.component';
import {
  DutyActionDialogComponent,
  DutyActionDialogData,
  DutyActionResult,
} from '../drivers/components/duty-action-dialog.component';
import {
  EventEditDialogComponent,
  EventEditDialogData,
} from '../drivers/components/event-edit-dialog.component';
import { BookingFormDialogComponent } from '../bookings/components/booking-form-dialog.component';
import { BookingDetailsDrawerComponent } from '../bookings/components/booking-details-drawer.component';
import { isoToDisplay } from '../../core/services/time.util';

type Tab = 'tracking' | 'performance' | 'management';

const TIMELINE_START = 6 * 60;
const TIMELINE_END = 22 * 60;
const PX_PER_MINUTE = 1.3;
const HOUR_MARKS = Array.from(
  { length: (TIMELINE_END - TIMELINE_START) / 60 + 1 },
  (_, i) => TIMELINE_START + i * 60
);

const STATUS_OPTIONS: BookingStatus[] = [
  'Requested', 'Accepted', 'Waiting', 'On Going', 'Completed',
  'No Show', 'Declined', 'Cancelled', 'Dropped',
];

@Component({
  selector: 'app-operations',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    SearchBarComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    TimelineEventComponent,
    BookingDetailsDrawerComponent,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatSidenavModule,
  ],
  template: `
    <app-page-header
      title="Operations"
      subtitle="Live tracking, performance analytics and schedule management"
    >
      <div actions class="header-actions">
        <input
          type="date"
          class="date-input"
          [value]="selectedDate()"
          (change)="onDateChange($event)"
          aria-label="Select date"
        />
      </div>
    </app-page-header>

    <!-- Tab Bar -->
    <div class="tab-bar card">
      <button
        class="tab-btn"
        type="button"
        [class.active]="activeTab() === 'tracking'"
        (click)="activeTab.set('tracking')"
      >
        <mat-icon>location_on</mat-icon> Tracking
      </button>
      <button
        class="tab-btn"
        type="button"
        [class.active]="activeTab() === 'performance'"
        (click)="activeTab.set('performance')"
      >
        <mat-icon>bar_chart</mat-icon> Performance
      </button>
      <button
        class="tab-btn"
        type="button"
        [class.active]="activeTab() === 'management'"
        (click)="activeTab.set('management')"
      >
        <mat-icon>manage_accounts</mat-icon> Management
      </button>
    </div>

    <!-- ═══════════════════════════════════════════════
         TRACKING TAB
    ════════════════════════════════════════════════ -->
    @if (activeTab() === 'tracking') {
      <div class="card" style="margin-top:16px;">
        <div class="section-header">
          <h3>Live Driver Status</h3>
          <span class="text-muted">{{ isoToDisplay(selectedDate()) }}</span>
        </div>

        @if (driverService.activeDrivers().length === 0) {
          <app-empty-state icon="badge" title="No drivers" description="Add drivers to track."></app-empty-state>
        } @else {
          <div class="tracking-grid">
            @for (driver of driverService.activeDrivers(); track driver.id) {
              <div class="tracking-card" [class.online]="driver.online">
                <div class="tracking-avatar">{{ driver.photoInitials }}</div>
                <div class="tracking-info">
                  <strong>{{ driver.name }}</strong>
                  <span class="text-muted">{{ driver.phone }}</span>
                </div>
                <div class="tracking-right">
                  <app-status-badge [status]="driver.online ? 'Online' : 'Offline'"></app-status-badge>
                  <app-status-badge [status]="driver.dutyStatus"></app-status-badge>
                </div>
              </div>
            }
          </div>

          <div class="section-header" style="margin-top:24px; border-top:1px solid var(--color-border); padding-top:16px;">
            <h3>Driver Timeline</h3>
            <app-search-bar placeholder="Search driver…" (search)="searchTerm.set($event)"></app-search-bar>
          </div>

          @if (filteredDrivers().length === 0) {
            <app-empty-state icon="search" title="No drivers match" description="Clear the search to see all drivers."></app-empty-state>
          } @else {
            <div class="timeline-wrapper scroll-x">
              <div class="timeline-grid" [style.width.px]="gridWidth">
                <div class="timeline-row header-row">
                  <div class="driver-cell sticky-col">Driver</div>
                  <div class="track header-track" [style.width.px]="trackWidth">
                    @for (mark of hourMarks; track mark) {
                      <span class="hour-label" [style.left.px]="(mark - timelineStart) * pxPerMinute">
                        {{ hourLabel(mark) }}
                      </span>
                    }
                  </div>
                </div>
                @for (driver of filteredDrivers(); track driver.id) {
                  <div class="timeline-row">
                    <div class="driver-cell sticky-col">
                      <div class="driver-main">
                        <span class="avatar">{{ driver.photoInitials }}</span>
                        <div class="driver-meta">
                          <strong>{{ driver.name }}</strong>
                          <app-status-badge [status]="driver.online ? 'Online' : 'Offline'"></app-status-badge>
                        </div>
                      </div>
                    </div>
                    <div class="track" [style.width.px]="trackWidth">
                      @for (mark of hourMarks; track mark) {
                        <span class="grid-line" [style.left.px]="(mark - timelineStart) * pxPerMinute"></span>
                      }
                      @for (evt of eventsFor(driver.id); track evt.id) {
                        <app-timeline-event
                          [event]="evt"
                          [pxPerMinute]="pxPerMinute"
                          [timelineStartMinutes]="timelineStart"
                          (select)="openEditEvent(driver, evt)"
                        ></app-timeline-event>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
            <div class="legend">
              <span><i class="dot" style="background:#2f5fdb"></i>Duty</span>
              <span><i class="dot" style="background:#c14fa3"></i>Pickup</span>
              <span><i class="dot" style="background:#7a4fd9"></i>Drop</span>
              <span><i class="dot" style="background:#a15c00"></i>Break</span>
              <span><i class="dot" style="background:#1b8f8f"></i>Vehicle Change</span>
              <span><i class="dot" style="background:#6b7280"></i>Empty Leg</span>
            </div>
          }
        }
      </div>
    }

    <!-- ═══════════════════════════════════════════════
         PERFORMANCE TAB
    ════════════════════════════════════════════════ -->
    @if (activeTab() === 'performance') {
      <!-- KPI Row -->
      <div class="perf-kpis">
        <div class="kpi-card">
          <div class="kpi-icon" style="background:#eaf0fe; color:#2f5fdb">
            <mat-icon>task_alt</mat-icon>
          </div>
          <div class="kpi-body">
            <span class="kpi-value">{{ completedTrips() }}</span>
            <span class="kpi-label">Trips Completed</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon" style="background:#fdf1de; color:#a15c00">
            <mat-icon>cancel</mat-icon>
          </div>
          <div class="kpi-body">
            <span class="kpi-value">{{ cancelledTrips() }}</span>
            <span class="kpi-label">Cancellations</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon" style="background:#fdeceb; color:#b3261e">
            <mat-icon>person_off</mat-icon>
          </div>
          <div class="kpi-body">
            <span class="kpi-value">{{ noShowTrips() }}</span>
            <span class="kpi-label">No Shows</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon" style="background:#e5f6ee; color:#17824f">
            <mat-icon>star</mat-icon>
          </div>
          <div class="kpi-body">
            <span class="kpi-value">{{ avgRating() }}</span>
            <span class="kpi-label">Avg Driver Rating</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon" style="background:#eaf0fe; color:#2f5fdb">
            <mat-icon>directions_bus</mat-icon>
          </div>
          <div class="kpi-body">
            <span class="kpi-value">{{ activeVehicles() }}</span>
            <span class="kpi-label">Active Vehicles</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon" style="background:#e5f6ee; color:#17824f">
            <mat-icon>badge</mat-icon>
          </div>
          <div class="kpi-body">
            <span class="kpi-value">{{ onlineDriverCount() }}</span>
            <span class="kpi-label">Drivers Online</span>
          </div>
        </div>
      </div>

      <div class="perf-grid">
        <!-- Driver Leaderboard -->
        <div class="card card-pad">
          <h3 style="margin-bottom:16px;">Driver Leaderboard</h3>
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Driver</th>
                <th>Status</th>
                <th>Rating</th>
                <th>Duty</th>
              </tr>
            </thead>
            <tbody>
              @for (driver of rankedDrivers(); track driver.id; let i = $index) {
                <tr>
                  <td>
                    <span class="rank-badge" [class.gold]="i===0" [class.silver]="i===1" [class.bronze]="i===2">
                      {{ i + 1 }}
                    </span>
                  </td>
                  <td>
                    <div class="driver-cell-inline">
                      <span class="avatar sm">{{ driver.photoInitials }}</span>
                      {{ driver.name }}
                    </div>
                  </td>
                  <td><app-status-badge [status]="driver.online ? 'Online' : 'Offline'"></app-status-badge></td>
                  <td>
                    <span class="rating-pill">★ {{ driver.rating }}</span>
                  </td>
                  <td><app-status-badge [status]="driver.dutyStatus"></app-status-badge></td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Booking Status Breakdown -->
        <div class="card card-pad">
          <h3 style="margin-bottom:16px;">Booking Status Breakdown</h3>
          <div class="breakdown-list">
            @for (item of bookingBreakdown(); track item.status) {
              <div class="breakdown-row">
                <div class="breakdown-label">
                  <app-status-badge [status]="item.status"></app-status-badge>
                </div>
                <div class="breakdown-bar-wrap">
                  <div class="breakdown-bar" [style.width.%]="item.pct"></div>
                </div>
                <span class="breakdown-count">{{ item.count }}</span>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Recent Trips -->
      <div class="card" style="margin-top:16px;">
        <div class="section-header">
          <h3>Recent Trips</h3>
        </div>
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
              @for (t of recentTrips(); track t.id) {
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
              } @empty {
                <tr><td colspan="9">
                  <app-empty-state icon="history" title="No trips found"></app-empty-state>
                </td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }

    <!-- ═══════════════════════════════════════════════
         MANAGEMENT TAB
    ════════════════════════════════════════════════ -->
    @if (activeTab() === 'management') {
      <!-- Driver Management Section -->
      <div class="card" style="margin-top:16px; margin-bottom:16px;">
        <div class="section-header">
          <div class="flex items-center gap-2">
            <h3>Driver Management</h3>
            <div class="filter-chips">
              <button class="chip" type="button" [class.active]="onlineFilter() === 'all'" (click)="onlineFilter.set('all')">All</button>
              <button class="chip" type="button" [class.active]="onlineFilter() === 'online'" (click)="onlineFilter.set('online')">Online</button>
              <button class="chip" type="button" [class.active]="onlineFilter() === 'offline'" (click)="onlineFilter.set('offline')">Offline</button>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <app-search-bar placeholder="Search driver…" (search)="searchTerm.set($event)"></app-search-bar>
            <button class="btn btn-primary" type="button" (click)="openAddDriver()">
              <mat-icon>add</mat-icon> Add Driver
            </button>
          </div>
        </div>

        @if (filteredDrivers().length === 0) {
          <app-empty-state icon="badge" title="No drivers match" description="Try a different search or filter."></app-empty-state>
        } @else {
          <div class="timeline-wrapper scroll-x">
            <div class="timeline-grid" [style.width.px]="gridWidth">
              <div class="timeline-row header-row">
                <div class="driver-cell sticky-col">Driver</div>
                <div class="track header-track" [style.width.px]="trackWidth">
                  @for (mark of hourMarks; track mark) {
                    <span class="hour-label" [style.left.px]="(mark - timelineStart) * pxPerMinute">
                      {{ hourLabel(mark) }}
                    </span>
                  }
                </div>
              </div>
              @for (driver of filteredDrivers(); track driver.id) {
                <div class="timeline-row">
                  <div class="driver-cell sticky-col">
                    <div class="driver-main">
                      <span class="avatar">{{ driver.photoInitials }}</span>
                      <div class="driver-meta">
                        <strong>{{ driver.name }}</strong>
                        <app-status-badge [status]="driver.online ? 'Online' : 'Offline'"></app-status-badge>
                      </div>
                    </div>
                    <button
                      class="icon-btn"
                      type="button"
                      [matMenuTriggerFor]="ctxMenu"
                      [attr.aria-label]="'Actions for ' + driver.name"
                    >
                      <mat-icon>more_vert</mat-icon>
                    </button>
                    <mat-menu #ctxMenu="matMenu">
                      <button mat-menu-item type="button" (click)="startDuty(driver)"><mat-icon>login</mat-icon><span>Start Duty</span></button>
                      <button mat-menu-item type="button" (click)="endDuty(driver)"><mat-icon>logout</mat-icon><span>End Duty</span></button>
                      <button mat-menu-item type="button" (click)="addBreak(driver)"><mat-icon>free_breakfast</mat-icon><span>Add Break</span></button>
                      <button mat-menu-item type="button" (click)="openEditDriver(driver)"><mat-icon>edit</mat-icon><span>Edit Driver</span></button>
                      <button mat-menu-item type="button" (click)="confirmDeleteDriver(driver)"><mat-icon>person_off</mat-icon><span>Deactivate</span></button>
                    </mat-menu>
                  </div>
                  <div class="track" [style.width.px]="trackWidth">
                    @for (mark of hourMarks; track mark) {
                      <span class="grid-line" [style.left.px]="(mark - timelineStart) * pxPerMinute"></span>
                    }
                    @for (evt of eventsFor(driver.id); track evt.id) {
                      <app-timeline-event
                        [event]="evt"
                        [pxPerMinute]="pxPerMinute"
                        [timelineStartMinutes]="timelineStart"
                        (select)="openEditEvent(driver, evt)"
                      ></app-timeline-event>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
          <div class="legend">
            <span><i class="dot" style="background:#2f5fdb"></i>Duty Start/End</span>
            <span><i class="dot" style="background:#c14fa3"></i>Pickup</span>
            <span><i class="dot" style="background:#7a4fd9"></i>Drop</span>
            <span><i class="dot" style="background:#a15c00"></i>Break</span>
            <span><i class="dot" style="background:#1b8f8f"></i>Vehicle Change</span>
            <span><i class="dot" style="background:#6b7280"></i>Empty Leg</span>
          </div>
        }
      </div>

      <!-- Booking Management Section -->
      <mat-sidenav-container class="booking-shell">
        <mat-sidenav-content>
          <div class="card">
            <div class="section-header">
              <h3>Booking Management</h3>
              <div class="flex items-center gap-2">
                <app-search-bar placeholder="Search Emp, ID, Booking ID" (search)="bookingService.onSearchInput($event)"></app-search-bar>
                <input type="date" class="date-input" [value]="bookingDateFilter()" (change)="onBookingDateChange($event)" aria-label="Filter by date" />
                <select class="date-input" [value]="bookingService.statusFilter()" (change)="onStatusChange($event)" aria-label="Filter status">
                  <option value="All">All statuses</option>
                  @for (s of statusOptions; track s) { <option [value]="s">{{ s }}</option> }
                </select>
                <button class="btn btn-primary" type="button" (click)="openCreateBooking()">
                  <mat-icon>add</mat-icon> Create Booking
                </button>
              </div>
            </div>

            @if (bookingService.pagedBookings().length === 0) {
              <app-empty-state icon="event_busy" title="No bookings found" description="Try adjusting your search or filters."></app-empty-state>
            } @else {
              <div class="scroll-x">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Booking ID</th>
                      <th>Employee</th>
                      <th>Status</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Vehicle</th>
                      <th>Requested Pickup Time</th>
                      <th>Pickup Time</th>
                      <th>Planned Drop</th>
                      <th>Actual Drop</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (b of bookingService.pagedBookings(); track b.id) {
                      <tr
                        class="clickable-row"
                        [class.selected-row]="selectedBooking()?.id === b.id"
                        (click)="viewBooking(b)"
                      >
                        <td>{{ b.id }}</td>
                        <td>{{ b.employeeName }}</td>
                        <td><app-status-badge [status]="b.status"></app-status-badge></td>
                        <td>{{ b.fromLocation }}</td>
                        <td>{{ b.toLocation }}</td>
                        <td>{{ vehicleNumber(b.vehicleId) }}</td>
                        <td>{{ b.requestedPickupTime }}</td>
                        <td>{{ b.actualPickupTime ?? '-' }}</td>
                        <td>{{ b.plannedDropTime ?? '-' }}</td>
                        <td>{{ b.actualDropTime ?? '-' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <div class="pagination">
                <span class="text-muted">
                  Showing {{ rangeStart() }}-{{ rangeEnd() }} of {{ bookingService.totalCount() }} items
                </span>
                <div class="page-buttons">
                  <button class="btn" type="button" [disabled]="bookingService.pageIndex() === 0" (click)="goToPage(bookingService.pageIndex() - 1)">
                    <mat-icon>chevron_left</mat-icon>
                  </button>
                  @for (p of pageNumbers(); track p) {
                    <button class="btn page-num" [class.btn-primary]="p - 1 === bookingService.pageIndex()" type="button" (click)="goToPage(p - 1)">
                      {{ p }}
                    </button>
                  }
                  <button class="btn" type="button" [disabled]="bookingService.pageIndex() >= totalPages() - 1" (click)="goToPage(bookingService.pageIndex() + 1)">
                    <mat-icon>chevron_right</mat-icon>
                  </button>
                </div>
              </div>
            }
          </div>
        </mat-sidenav-content>

        <mat-sidenav
          mode="over"
          position="end"
          class="booking-drawer"
          [opened]="!!selectedBooking()"
          (closedStart)="selectedBooking.set(null)"
        >
          <app-booking-details-drawer
            [booking]="selectedBooking()"
            (close)="selectedBooking.set(null)"
            (edit)="openEditBooking($event)"
            (signInRider)="onSignIn($event)"
            (markNoShow)="onMarkNoShow($event)"
            (cancelBooking)="onCancel($event)"
          ></app-booking-details-drawer>
        </mat-sidenav>
      </mat-sidenav-container>
    }
  `,
  styles: [
    `
      /* ── Header ── */
      .header-actions { display: flex; gap: 10px; align-items: center; }
      .date-input {
        border: 1px solid var(--color-border-strong);
        border-radius: var(--radius-md);
        padding: 7px 10px;
        font-size: 12.5px;
        background: var(--color-surface);
        color: var(--color-text);
        height: 36px;
      }

      /* ── Tab Bar ── */
      .tab-bar {
        display: flex;
        gap: 0;
        padding: 0 4px;
        margin-top: 16px;
        border-radius: var(--radius-lg);
        overflow: hidden;
      }
      .tab-btn {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 12px 20px;
        border: none;
        background: transparent;
        font-size: 13.5px;
        font-weight: 600;
        color: var(--color-text-muted);
        cursor: pointer;
        border-bottom: 3px solid transparent;
        transition: color 0.12s, border-color 0.12s, background 0.12s;
        border-radius: 0;
      }
      .tab-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
      .tab-btn:hover { background: var(--color-bg); color: var(--color-text); }
      .tab-btn.active {
        color: var(--color-primary);
        border-bottom-color: var(--color-primary);
        background: var(--color-primary-light);
      }

      /* ── Section header shared ── */
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        padding: 14px 16px;
        flex-wrap: wrap;
        border-bottom: 1px solid var(--color-border);
      }
      .section-header h3 { font-size: 14px; }

      /* ── Tracking cards ── */
      .tracking-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 12px;
        padding: 16px;
      }
      .tracking-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 14px;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        background: var(--color-bg);
        transition: border-color 0.12s;
      }
      .tracking-card.online { border-color: #b7e4cf; background: #f2fbf6; }
      .tracking-avatar {
        width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
        background: var(--color-primary-light); color: var(--color-primary-dark);
        display: flex; align-items: center; justify-content: center;
        font-size: 12px; font-weight: 700;
      }
      .tracking-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
      .tracking-info strong { font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .tracking-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }

      /* ── Performance KPIs ── */
      .perf-kpis {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 14px;
        margin-top: 16px;
      }
      .kpi-card {
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        padding: 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        box-shadow: var(--shadow-sm);
      }
      .kpi-icon {
        width: 40px; height: 40px; border-radius: var(--radius-md);
        display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      }
      .kpi-icon mat-icon { font-size: 20px; width: 20px; height: 20px; }
      .kpi-body { display: flex; flex-direction: column; gap: 2px; }
      .kpi-value { font-size: 22px; font-weight: 700; line-height: 1; }
      .kpi-label { font-size: 11.5px; color: var(--color-text-muted); }

      .perf-grid {
        display: grid;
        grid-template-columns: 1.4fr 1fr;
        gap: 16px;
        margin-top: 16px;
      }
      @media (max-width: 900px) { .perf-grid { grid-template-columns: 1fr; } }

      /* Rank badge */
      .rank-badge {
        display: inline-flex; align-items: center; justify-content: center;
        width: 22px; height: 22px; border-radius: 50%;
        font-size: 11px; font-weight: 700;
        background: var(--color-neutral-bg); color: var(--color-neutral);
      }
      .rank-badge.gold   { background: #fef3c7; color: #92400e; }
      .rank-badge.silver { background: #f1f5f9; color: #475569; }
      .rank-badge.bronze { background: #fef2e7; color: #9a3412; }

      .rating-pill {
        display: inline-flex; align-items: center; gap: 2px;
        background: #fef9ee; color: #a15c00;
        font-size: 12px; font-weight: 600;
        padding: 2px 8px; border-radius: 999px;
      }

      .driver-cell-inline { display: flex; align-items: center; gap: 8px; }
      .avatar.sm { width: 24px; height: 24px; font-size: 9px; }

      /* Breakdown bars */
      .breakdown-list { display: flex; flex-direction: column; gap: 10px; }
      .breakdown-row { display: flex; align-items: center; gap: 10px; }
      .breakdown-label { min-width: 100px; }
      .breakdown-bar-wrap { flex: 1; height: 6px; background: var(--color-border); border-radius: 99px; overflow: hidden; }
      .breakdown-bar { height: 100%; background: var(--color-primary); border-radius: 99px; transition: width 0.3s ease; }
      .breakdown-count { min-width: 28px; text-align: right; font-size: 12px; font-weight: 600; color: var(--color-text-muted); }

      /* ── Management: Timeline ── */
      .filter-chips { display: flex; gap: 6px; }
      .chip {
        border: 1px solid var(--color-border-strong);
        background: var(--color-surface);
        border-radius: 999px;
        padding: 4px 12px;
        font-size: 12px;
        cursor: pointer;
        color: var(--color-text-muted);
      }
      .chip.active { background: var(--color-primary); border-color: var(--color-primary); color: #fff; }

      .timeline-wrapper { border-top: 1px solid var(--color-border); }
      .timeline-grid { position: relative; }
      .timeline-row { display: flex; border-bottom: 1px solid var(--color-border); }
      .timeline-row:last-child { border-bottom: none; }
      .header-row { background: #fafbfc; position: sticky; top: 0; z-index: 3; }

      .sticky-col {
        position: sticky; left: 0; z-index: 2; background: var(--color-surface);
        width: 240px; min-width: 240px;
        display: flex; align-items: center; justify-content: space-between;
        gap: 6px; padding: 10px 12px;
        border-right: 1px solid var(--color-border);
      }
      .header-row .sticky-col { background: #fafbfc; font-size: 11.5px; text-transform: uppercase; color: var(--color-text-muted); font-weight: 600; letter-spacing: .04em; }

      .driver-main { display: flex; align-items: center; gap: 8px; min-width: 0; }
      .driver-meta { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
      .driver-meta strong { font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 130px; }
      .avatar {
        width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
        background: var(--color-primary-light); color: var(--color-primary-dark);
        display: flex; align-items: center; justify-content: center;
        font-size: 11px; font-weight: 700;
      }
      .icon-btn { border: none; background: transparent; cursor: pointer; color: var(--color-text-muted); width: 28px; height: 28px; border-radius: 6px; flex-shrink: 0; }
      .icon-btn:hover { background: var(--color-bg); }

      .track { position: relative; height: 40px; }
      .header-track { height: 30px; }
      .hour-label { position: absolute; top: 6px; font-size: 11px; color: var(--color-text-faint); transform: translateX(-4px); }
      .grid-line { position: absolute; top: 0; bottom: 0; width: 1px; background: var(--color-border); }

      .legend { display: flex; flex-wrap: wrap; gap: 16px; padding: 12px 16px; border-top: 1px solid var(--color-border); font-size: 12px; color: var(--color-text-muted); }
      .legend .dot { display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin-right: 5px; vertical-align: middle; }

      /* ── Booking table ── */
      .clickable-row { cursor: pointer; }
      .clickable-row:hover { background: #f0f5ff !important; }
      .selected-row { background: #eaf0fe !important; }

      .pagination { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; flex-wrap: wrap; gap: 10px; }
      .page-buttons { display: flex; gap: 4px; }
      .page-num { min-width: 34px; justify-content: center; padding: 6px 0; }

      /* ── Booking Drawer ── */
      .booking-shell { background: transparent; }
      ::ng-deep .booking-drawer { width: 420px !important; border-left: 1px solid var(--color-border); box-shadow: var(--shadow-lg); }
      @media (max-width: 640px) { ::ng-deep .booking-drawer { width: 100% !important; } }
    `,
  ],
})
export class OperationsComponent {
  driverService = inject(DriverService);
  bookingService = inject(BookingService);
  private vehicleService = inject(VehicleService);
  private tripService = inject(TripService);
  private dialog = inject(MatDialog);
  private notifications = inject(NotificationService);
  routeService = inject(RouteService);

  // ── State ──
  activeTab = signal<Tab>('management');
  selectedDate = signal(todayIso());
  searchTerm = signal('');
  onlineFilter = signal<'all' | 'online' | 'offline'>('all');
  selectedBooking = signal<Booking | null>(null);
  statusOptions = STATUS_OPTIONS;
  isoToDisplay = isoToDisplay;

  // ── Timeline constants ──
  timelineStart = TIMELINE_START;
  pxPerMinute = PX_PER_MINUTE;
  trackWidth = (TIMELINE_END - TIMELINE_START) * PX_PER_MINUTE;
  gridWidth = 240 + this.trackWidth;
  hourMarks = HOUR_MARKS;

  // ── Filtered drivers ──
  filteredDrivers = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const filter = this.onlineFilter();
    return this.driverService.activeDrivers().filter((d) => {
      if (term && !d.name.toLowerCase().includes(term)) return false;
      if (filter === 'online' && !d.online) return false;
      if (filter === 'offline' && d.online) return false;
      return true;
    });
  });

  // ── Performance signals ──
  completedTrips = computed(() => this.tripService.trips().filter((t) => t.status === 'Completed').length);
  cancelledTrips = computed(() => this.tripService.trips().filter((t) => t.status === 'Cancelled').length);
  noShowTrips   = computed(() => this.tripService.trips().filter((t) => t.status === 'No Show').length);
  activeVehicles = computed(() => this.vehicleService.vehicles().filter((v) => v.status === 'In Use').length);
  onlineDriverCount = computed(() => this.driverService.activeDrivers().filter((d) => d.online).length);
  avgRating = computed(() => {
    const drivers = this.driverService.activeDrivers();
    if (!drivers.length) return '—';
    const avg = drivers.reduce((s, d) => s + d.rating, 0) / drivers.length;
    return avg.toFixed(1);
  });

  rankedDrivers = computed(() =>
    [...this.driverService.activeDrivers()].sort((a, b) => b.rating - a.rating).slice(0, 10)
  );

  bookingBreakdown = computed(() => {
    const all = this.bookingService.bookings();
    const total = all.length || 1;
    return STATUS_OPTIONS.map((status) => {
      const count = all.filter((b) => b.status === status).length;
      return { status, count, pct: Math.round((count / total) * 100) };
    }).filter((i) => i.count > 0);
  });

  recentTrips = computed(() =>
    [...this.tripService.trips()]
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 15)
  );

  // ── Booking pagination ──
  rangeStart = computed(() => {
    const total = this.bookingService.totalCount();
    if (total === 0) return 0;
    return this.bookingService.pageIndex() * this.bookingService.pageSize() + 1;
  });
  rangeEnd = computed(() =>
    Math.min((this.bookingService.pageIndex() + 1) * this.bookingService.pageSize(), this.bookingService.totalCount())
  );
  totalPages = computed(() => Math.max(1, Math.ceil(this.bookingService.totalCount() / this.bookingService.pageSize())));
  pageNumbers = computed(() => {
    const total = this.totalPages();
    const maxButtons = 5;
    if (total <= maxButtons) return Array.from({ length: total }, (_, i) => i + 1);
    const current = this.bookingService.pageIndex() + 1;
    const start = Math.max(1, Math.min(current - 2, total - maxButtons + 1));
    return Array.from({ length: maxButtons }, (_, i) => start + i);
  });

  bookingDateFilter = computed(() => {
    const v = this.bookingService.dateFilter();
    return v === 'All' ? '' : v;
  });

  // ── Helpers ──
  eventsFor(driverId: string): DriverScheduleEvent[] {
    return this.driverService.eventsForDriver(driverId, this.selectedDate());
  }

  hourLabel(minutes: number): string {
    return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:00`;
  }

  vehicleNumber(vehicleId: string | null): string {
    if (!vehicleId) return '-';
    return this.vehicleService.getById(vehicleId)?.vehicleNumber ?? '-';
  }

  onDateChange(e: Event): void {
    const v = (e.target as HTMLInputElement).value;
    if (v) this.selectedDate.set(v);
  }

  onBookingDateChange(e: Event): void {
    const v = (e.target as HTMLInputElement).value;
    this.bookingService.setDateFilter(v || 'All');
  }

  onStatusChange(e: Event): void {
    this.bookingService.setStatusFilter((e.target as HTMLSelectElement).value as BookingStatus | 'All');
  }

  goToPage(index: number): void {
    this.bookingService.setPage(Math.max(0, Math.min(index, this.totalPages() - 1)));
  }

  viewBooking(b: Booking): void {
    this.selectedBooking.set(b);
  }

  // ── Driver actions ──
  openAddDriver(): void {
    const ref = this.dialog.open(DriverFormDialogComponent, { data: {}, width: '440px' });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.driverService.add({ ...result, dutyStatus: 'off-duty', currentVehicleId: null, rating: 4.8, joinedDate: todayIso() });
      this.notifications.success('Driver added successfully.');
    });
  }

  openEditDriver(driver: Driver): void {
    const ref = this.dialog.open(DriverFormDialogComponent, { data: { driver }, width: '440px' });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.driverService.update(driver.id, result);
      this.notifications.success('Driver updated.');
    });
  }

  confirmDeleteDriver(driver: Driver): void {
    const data: ConfirmDialogData = { title: 'Deactivate driver?', message: `${driver.name} will be marked inactive.`, confirmLabel: 'Deactivate', danger: true };
    this.dialog.open(ConfirmDialogComponent, { data, width: '420px' }).afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.driverService.deactivate(driver.id);
      this.notifications.success(`${driver.name} deactivated.`);
    });
  }

  startDuty(driver: Driver): void {
    const data: DutyActionDialogData = { mode: 'start-duty', driverName: driver.name };
    this.dialog.open(DutyActionDialogComponent, { data, width: '380px' }).afterClosed().subscribe((result: DutyActionResult | undefined) => {
      if (!result) return;
      this.driverService.startDuty(driver.id, this.selectedDate(), result.startMinutes!, result.endMinutes, result.notes);
      this.notifications.success(`Duty started for ${driver.name}.`);
    });
  }

  endDuty(driver: Driver): void {
    const data: DutyActionDialogData = { mode: 'end-duty', driverName: driver.name };
    this.dialog.open(DutyActionDialogComponent, { data, width: '380px' }).afterClosed().subscribe((result: DutyActionResult | undefined) => {
      if (!result) return;
      this.driverService.endDuty(driver.id, this.selectedDate(), result.endMinutes);
      this.notifications.success(`Duty ended for ${driver.name}.`);
    });
  }

  addBreak(driver: Driver): void {
    const data: DutyActionDialogData = { mode: 'add-break', driverName: driver.name };
    this.dialog.open(DutyActionDialogComponent, { data, width: '380px' }).afterClosed().subscribe((result: DutyActionResult | undefined) => {
      if (!result) return;
      this.driverService.addBreak(driver.id, this.selectedDate(), result.startMinutes!, result.endMinutes, result.notes);
      this.notifications.success(`Break added for ${driver.name}.`);
    });
  }

  openEditEvent(driver: Driver, event: DriverScheduleEvent): void {
    const data: EventEditDialogData = { event, driverName: driver.name };
    this.dialog.open(EventEditDialogComponent, { data, width: '380px' }).afterClosed().subscribe((result) => {
      if (!result) return;
      if (result.action === 'delete') {
        this.driverService.removeEvent(event.id);
        this.notifications.info('Timeline event removed.');
      } else if (result.action === 'save') {
        this.driverService.updateEvent(event.id, result.changes);
        this.notifications.success('Timeline event updated.');
      }
    });
  }

  // ── Booking actions ──
  openCreateBooking(): void {
    const ref = this.dialog.open(BookingFormDialogComponent, { data: {}, width: '520px' });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.bookingService.add({ ...result, actualDropTime: null });
      this.notifications.success('Booking created successfully.');
    });
  }

  openEditBooking(booking: Booking): void {
    const ref = this.dialog.open(BookingFormDialogComponent, { data: { booking }, width: '520px' });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.bookingService.update(booking.id, result);
      this.selectedBooking.set(this.bookingService.getById(booking.id) ?? null);
      this.notifications.success('Booking updated.');
    });
  }

  onSignIn(id: string): void {
    this.bookingService.signInRider(id);
    this.selectedBooking.set(this.bookingService.getById(id) ?? null);
    this.notifications.success('Rider signed in.');
  }

  onMarkNoShow(id: string): void {
    this.bookingService.markNoShow(id);
    this.selectedBooking.set(this.bookingService.getById(id) ?? null);
    this.notifications.info('Booking marked as No Show.');
  }

  onCancel(id: string): void {
    const data: ConfirmDialogData = { title: 'Cancel booking?', message: `Booking ${id} will be cancelled.`, confirmLabel: 'Cancel Booking', danger: true };
    this.dialog.open(ConfirmDialogComponent, { data, width: '420px' }).afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.bookingService.cancel(id);
      this.selectedBooking.set(this.bookingService.getById(id) ?? null);
      this.notifications.success('Booking cancelled.');
    });
  }
}
