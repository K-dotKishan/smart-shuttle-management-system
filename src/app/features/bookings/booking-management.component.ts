import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SearchBarComponent } from '../../shared/components/search-bar/search-bar.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { BookingService, DriverService, NotificationService, RouteService, VehicleService } from '../../core/services';
import { Booking, BookingStatus } from '../../core/models';
import { BookingFormDialogComponent } from './components/booking-form-dialog.component';
import { BookingDetailsDrawerComponent } from './components/booking-details-drawer.component';

const STATUS_OPTIONS: BookingStatus[] = [
  'Requested', 'Accepted', 'Waiting', 'On Going', 'Completed', 'No Show', 'Declined', 'Cancelled', 'Dropped',
];

@Component({
  selector: 'app-booking-management',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    SearchBarComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    BookingDetailsDrawerComponent,
  ],
  template: `
    <app-page-header title="Journeys" subtitle="View and manage every employee shuttle journey">
      <div actions>
        <button class="btn btn-primary" type="button" (click)="openCreate()">
          <mat-icon>add</mat-icon>
          Create Booking
        </button>
      </div>
    </app-page-header>

    <!-- Page shell: table + overlay drawer side by side -->
    <div class="page-shell">
      <div class="card table-card">
        <!-- Toolbar -->
        <div class="toolbar">
          <app-search-bar
            placeholder="Search Booking ID or Employee"
            (search)="bookingService.onSearchInput($event)"
            style="flex:1; max-width: 400px;"
          ></app-search-bar>

          <div class="filters">
            <select class="filter-select" [value]="bookingService.statusFilter()" (change)="onStatusChange($event)" aria-label="Filter by status">
              <option value="All">All statuses</option>
              @for (s of statusOptions; track s) { <option [value]="s">{{ s }}</option> }
            </select>

            <input
              type="date"
              class="filter-select"
              [value]="dateFilterValue()"
              (change)="onDateChange($event)"
              aria-label="Filter by date"
            />

            <select class="filter-select" [value]="bookingService.routeFilter()" (change)="onRouteChange($event)" aria-label="Filter by route">
              <option value="All">All routes</option>
              @for (r of routeService.routes(); track r.id) { <option [value]="r.id">{{ r.name }}</option> }
            </select>

            <select class="filter-select" [value]="bookingService.driverFilter()" (change)="onDriverChange($event)" aria-label="Filter by driver">
              <option value="All">All drivers</option>
              @for (d of driverService.activeDrivers(); track d.id) { <option [value]="d.id">{{ d.name }}</option> }
            </select>
          </div>
        </div>

        @if (bookingService.pagedBookings().length === 0) {
          <app-empty-state icon="event_busy" title="No bookings found" description="Try adjusting your search or filters."></app-empty-state>
        } @else {
          <div class="scroll-x">
            <table class="data-table">
              <thead>
                <tr>
                  <th>BOOKING ID</th>
                  <th>EMPLOYEE</th>
                  <th>STATUS</th>
                  <th>FROM</th>
                  <th>TO</th>
                  <th>VEHICLE</th>
                  <th>REQUESTED PICKUP</th>
                  <th>PICKUP TIME</th>
                  <th>PLANNED DROP</th>
                  <th>ACTUAL DROP</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (b of bookingService.pagedBookings(); track b.id) {
                  <tr [class.row-selected]="selectedBooking()?.id === b.id" (click)="viewBooking(b)" style="cursor:pointer">
                    <td class="id-cell">{{ b.id }}</td>
                    <td>{{ b.employeeName }}</td>
                    <td><app-status-badge [status]="b.status"></app-status-badge></td>
                    <td>{{ b.fromLocation }}</td>
                    <td>{{ b.toLocation }}</td>
                    <td>{{ vehicleNumber(b.vehicleId) }}</td>
                    <td>{{ b.requestedPickupTime }}</td>
                    <td>{{ b.actualPickupTime ?? '-' }}</td>
                    <td>{{ b.plannedDropTime ?? '-' }}</td>
                    <td>{{ b.actualDropTime ?? '-' }}</td>
                    <td>
                      <button class="btn btn-sm" type="button" (click)="$event.stopPropagation(); viewBooking(b)">View</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="pagination">
            <span class="text-muted pag-info">
              Showing {{ rangeStart() }}–{{ rangeEnd() }} of {{ bookingService.totalCount() }} items
            </span>
            <div class="page-buttons">
              <button class="btn" type="button" [disabled]="bookingService.pageIndex() === 0" (click)="goToPage(bookingService.pageIndex() - 1)">
                <mat-icon>chevron_left</mat-icon>
              </button>
              @for (p of pageNumbers(); track p) {
                <button
                  class="btn page-num"
                  [class.btn-primary]="p - 1 === bookingService.pageIndex()"
                  type="button"
                  (click)="goToPage(p - 1)"
                >{{ p }}</button>
              }
              <button class="btn" type="button" [disabled]="bookingService.pageIndex() >= totalPages() - 1" (click)="goToPage(bookingService.pageIndex() + 1)">
                <mat-icon>chevron_right</mat-icon>
              </button>
            </div>
          </div>
        }
      </div>

      <!-- Overlay drawer — does NOT shrink the table -->
      @if (selectedBooking()) {
        <div class="drawer-overlay" role="dialog" aria-label="Booking details">
          <app-booking-details-drawer
            [booking]="selectedBooking()"
            (close)="selectedBooking.set(null)"
            (edit)="openEdit($event)"
            (signInRider)="onSignIn($event)"
            (markNoShow)="onMarkNoShow($event)"
            (cancelBooking)="onCancel($event)"
          ></app-booking-details-drawer>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .page-shell {
        position: relative;
        display: flex;
        gap: 0;
        align-items: flex-start;
      }

      .table-card {
        flex: 1;
        min-width: 0;
        transition: margin-right 0.2s ease;
      }

      /* Overlay drawer — fixed width, sits to the right, slides in */
      .drawer-overlay {
        width: 400px;
        min-width: 400px;
        max-width: 400px;
        flex-shrink: 0;
        height: calc(100vh - 60px - 48px);
        position: sticky;
        top: 0;
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-lg);
        overflow: hidden;
        margin-left: 16px;
        animation: slideIn 0.18s ease;
      }

      @keyframes slideIn {
        from { opacity: 0; transform: translateX(12px); }
        to   { opacity: 1; transform: translateX(0); }
      }

      @media (max-width: 1100px) {
        .drawer-overlay {
          position: fixed;
          top: 60px;
          right: 16px;
          bottom: 16px;
          height: auto;
          margin-left: 0;
          z-index: 50;
        }
      }
      @media (max-width: 640px) {
        .drawer-overlay { width: calc(100vw - 32px); min-width: 0; max-width: none; right: 16px; }
      }

      /* Toolbar */
      .toolbar {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 16px;
        flex-wrap: wrap;
        border-bottom: 1px solid var(--color-border);
      }
      .filters { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
      .filter-select {
        border: 1px solid var(--color-border-strong);
        border-radius: var(--radius-md);
        padding: 7px 10px;
        font-size: 12.5px;
        background: var(--color-surface);
        color: var(--color-text);
        height: 34px;
      }
      .filter-select:focus { outline: 2px solid var(--color-primary); }

      /* Table tweaks */
      .id-cell { font-weight: 600; color: var(--color-primary); }
      .row-selected td { background: var(--color-primary-light) !important; }
      .btn-sm { padding: 5px 10px; font-size: 12px; }

      /* Pagination */
      .pagination {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        flex-wrap: wrap;
        gap: 10px;
        border-top: 1px solid var(--color-border);
      }
      .pag-info { font-size: 12.5px; }
      .page-buttons { display: flex; gap: 4px; }
      .page-num { min-width: 34px; justify-content: center; padding: 6px 0; }
    `,
  ],
})
export class BookingManagementComponent {
  bookingService = inject(BookingService);
  driverService = inject(DriverService);
  routeService = inject(RouteService);
  private vehicleService = inject(VehicleService);
  private dialog = inject(MatDialog);
  private notifications = inject(NotificationService);

  statusOptions = STATUS_OPTIONS;
  selectedBooking = signal<Booking | null>(null);

  rangeStart = computed(() =>
    bookingRangeStart(this.bookingService.pageIndex(), this.bookingService.pageSize(), this.bookingService.totalCount())
  );
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

  dateFilterValue(): string {
    const v = this.bookingService.dateFilter();
    return v === 'All' ? '' : v;
  }

  vehicleNumber(vehicleId: string | null): string {
    if (!vehicleId) return '-';
    return this.vehicleService.getById(vehicleId)?.vehicleNumber ?? '-';
  }

  onStatusChange(e: Event): void {
    this.bookingService.setStatusFilter((e.target as HTMLSelectElement).value as BookingStatus | 'All');
  }
  onDateChange(e: Event): void {
    const v = (e.target as HTMLInputElement).value;
    this.bookingService.setDateFilter(v || 'All');
  }
  onRouteChange(e: Event): void {
    this.bookingService.setRouteFilter((e.target as HTMLSelectElement).value);
  }
  onDriverChange(e: Event): void {
    this.bookingService.setDriverFilter((e.target as HTMLSelectElement).value);
  }

  goToPage(index: number): void {
    this.bookingService.setPage(Math.max(0, Math.min(index, this.totalPages() - 1)));
  }

  viewBooking(b: Booking): void {
    this.selectedBooking.set(b);
  }

  openCreate(): void {
    const ref = this.dialog.open(BookingFormDialogComponent, { data: {}, width: '520px' });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.bookingService.add({ ...result, actualDropTime: null });
      this.notifications.success('Booking created successfully.');
    });
  }

  openEdit(booking: Booking): void {
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
    const data: ConfirmDialogData = {
      title: 'Cancel booking?',
      message: `Booking ${id} will be marked as Cancelled. This action cannot be undone.`,
      confirmLabel: 'Cancel Booking',
      danger: true,
    };
    const ref = this.dialog.open(ConfirmDialogComponent, { data, width: '420px' });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.bookingService.cancel(id);
      this.selectedBooking.set(this.bookingService.getById(id) ?? null);
      this.notifications.success('Booking cancelled.');
    });
  }
}

function bookingRangeStart(pageIndex: number, pageSize: number, total: number): number {
  if (total === 0) return 0;
  return pageIndex * pageSize + 1;
}
