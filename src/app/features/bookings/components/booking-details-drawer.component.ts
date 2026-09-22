import { ChangeDetectionStrategy, Component, EventEmitter, Output, computed, inject, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Booking } from '../../../core/models';
import { DriverService, VehicleService } from '../../../core/services';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { isoToDisplay } from '../../../core/services/time.util';

@Component({
  selector: 'app-booking-details-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, StatusBadgeComponent],
  template: `
    @if (booking(); as b) {
      <div class="drawer-inner">

        <!-- ── Header ── -->
        <header class="drawer-header">
          <div class="drawer-id-block">
            <span class="drawer-id-label">Booking ID</span>
            <span class="drawer-id-value">{{ b.id }}</span>
          </div>
          <button class="close-btn" type="button" (click)="close.emit()" aria-label="Close details">
            <mat-icon>close</mat-icon>
          </button>
        </header>

        <!-- ── Employee row ── -->
        <div class="emp-row">
          <div class="emp-info">
            <strong class="emp-name">{{ b.employeeName }}</strong>
            <span class="emp-meta">Emp ID: {{ b.employeeId }}</span>
            <span class="emp-meta">{{ isoToDisplay(b.date) }}</span>
          </div>
          <app-status-badge [status]="b.status"></app-status-badge>
        </div>

        <!-- ── Vehicle card ── -->
        <div class="detail-section">
          <span class="section-label">VEHICLE</span>
          @if (vehicle(); as v) {
            <div class="vehicle-card">
              <div class="vehicle-bus-img">
                <!-- Inline bus SVG matching the reference screenshot -->
                <svg viewBox="0 0 80 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Bus illustration">
                  <!-- Body -->
                  <rect x="4" y="10" width="72" height="26" rx="5" fill="#d1d9e8"/>
                  <!-- Roof -->
                  <rect x="8" y="6" width="64" height="8" rx="3" fill="#b0bbcf"/>
                  <!-- Windows row -->
                  <rect x="12" y="13" width="10" height="8" rx="2" fill="#e8f0fe"/>
                  <rect x="26" y="13" width="10" height="8" rx="2" fill="#e8f0fe"/>
                  <rect x="40" y="13" width="10" height="8" rx="2" fill="#e8f0fe"/>
                  <rect x="54" y="13" width="10" height="8" rx="2" fill="#e8f0fe"/>
                  <!-- Front windshield -->
                  <rect x="66" y="12" width="7" height="10" rx="2" fill="#c4d4f0"/>
                  <!-- Door -->
                  <rect x="12" y="24" width="8" height="10" rx="1" fill="#b0bbcf"/>
                  <!-- Undercarriage / bumper -->
                  <rect x="4" y="33" width="72" height="4" rx="2" fill="#8a96aa"/>
                  <!-- Wheels -->
                  <circle cx="18" cy="38" r="5" fill="#444c5e"/>
                  <circle cx="18" cy="38" r="2.5" fill="#8a96aa"/>
                  <circle cx="62" cy="38" r="5" fill="#444c5e"/>
                  <circle cx="62" cy="38" r="2.5" fill="#8a96aa"/>
                  <!-- Headlight -->
                  <rect x="70" y="23" width="4" height="3" rx="1" fill="#fef08a"/>
                  <!-- Stripe -->
                  <rect x="4" y="22" width="72" height="2" fill="#3b6ef0" opacity="0.35"/>
                </svg>
              </div>
              <div class="vehicle-details">
                <strong class="vehicle-number">{{ v.vehicleNumber }}</strong>
                <div class="vehicle-meta-row">
                  <span class="vehicle-meta-item">{{ v.registrationNumber }}</span>
                  <span class="vehicle-sep">|</span>
                  <span class="vehicle-meta-item">{{ v.vehicleType }}</span>
                  <span class="vehicle-sep">|</span>
                  <span class="vehicle-meta-item capacity-item">
                    <mat-icon class="cap-icon">group</mat-icon>{{ v.capacity }}
                  </span>
                </div>
              </div>
            </div>
          } @else {
            <p class="text-muted no-data">No vehicle assigned yet.</p>
          }
        </div>

        <!-- ── Journey ── -->
        <div class="detail-section">
          <span class="section-label">JOURNEY</span>
          <div class="journey-card">
            <div class="journey-stop">
              <span class="stop-dot stop-origin"></span>
              <div class="stop-content">
                <strong class="stop-name">{{ b.fromLocation }}</strong>
                <span class="stop-time">Requested Pickup Time: {{ b.requestedPickupTime }}</span>
                @if (b.actualPickupTime) {
                  <span class="stop-time">Actual: {{ b.actualPickupTime }}</span>
                }
              </div>
              <span class="stop-badge">{{ b.requestedPickupTime }}</span>
            </div>
            <div class="journey-connector"></div>
            <div class="journey-stop">
              <span class="stop-dot stop-dest"></span>
              <div class="stop-content">
                <strong class="stop-name">{{ b.toLocation }}</strong>
                @if (b.plannedDropTime) {
                  <span class="stop-time">Planned Drop: {{ b.plannedDropTime }}</span>
                }
                @if (b.actualDropTime) {
                  <span class="stop-time">Actual drop: {{ b.actualDropTime }}</span>
                }
              </div>
              <span class="stop-badge muted">{{ b.plannedDropTime ?? '-' }}</span>
            </div>
          </div>
        </div>

        <!-- ── Driver ── -->
        @if (driver(); as d) {
          <div class="driver-row">
            <span class="driver-avatar">{{ d.photoInitials }}</span>
            <span class="driver-name">{{ d.name }}</span>
            <span class="text-muted driver-meta">&#9742; {{ d.phone }}</span>
            <span class="driver-rating">{{ d.rating }} &#9733;</span>
          </div>
        }

        <!-- ── Quick actions ── -->
        <div class="quick-actions">
          <button
            class="quick-action"
            type="button"
            [disabled]="b.status === 'Cancelled' || b.status === 'Completed'"
            (click)="signInRider.emit(b.id)"
          >
            <mat-icon>login</mat-icon>
            <span>Sign in rider</span>
          </button>
          <button
            class="quick-action danger"
            type="button"
            [disabled]="b.status === 'Cancelled' || b.status === 'Completed'"
            (click)="markNoShow.emit(b.id)"
          >
            <mat-icon>do_not_disturb_on</mat-icon>
            <span>Mark rider as No-show</span>
          </button>
        </div>

        @if (b.notes) {
          <div class="detail-section">
            <span class="section-label">NOTES</span>
            <p class="text-muted" style="margin: 0; font-size: 13px;">{{ b.notes }}</p>
          </div>
        }

        <!-- ── Footer actions ── -->
        <footer class="drawer-footer">
          <button
            class="footer-action-icon"
            type="button"
            title="View history"
          >
            <mat-icon>history</mat-icon>
          </button>
          <button
            class="btn-cancel-booking"
            type="button"
            [disabled]="b.status === 'Cancelled' || b.status === 'Completed'"
            (click)="cancelBooking.emit(b.id)"
          >
            <mat-icon>cancel</mat-icon>
            Cancel Booking
          </button>
          <button class="btn-edit-booking" type="button" (click)="edit.emit(b)">
            <mat-icon>edit</mat-icon>
            Edit
          </button>
        </footer>

      </div>
    }
  `,
  styles: [`
    .drawer-inner {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow-y: auto;
      background: var(--color-surface);
    }

    /* ── Header ── */
    .drawer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px 12px;
      border-bottom: 1px solid var(--color-border);
    }
    .drawer-id-label {
      display: block;
      font-size: 11px;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: .05em;
      margin-bottom: 2px;
    }
    .drawer-id-value {
      font-size: 17px;
      font-weight: 700;
      color: var(--color-text);
    }
    .close-btn {
      border: none;
      background: transparent;
      cursor: pointer;
      color: var(--color-text-muted);
      width: 30px;
      height: 30px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .close-btn:hover { background: var(--color-bg); }

    /* ── Employee row ── */
    .emp-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 20px;
      border-bottom: 1px solid var(--color-border);
    }
    .emp-info { display: flex; flex-direction: column; gap: 2px; }
    .emp-name { font-size: 15px; font-weight: 600; }
    .emp-meta { font-size: 12px; color: var(--color-text-muted); }

    /* ── Sections ── */
    .detail-section {
      padding: 14px 20px;
      border-bottom: 1px solid var(--color-border);
    }
    .section-label {
      display: block;
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: .07em;
      color: var(--color-text-muted);
      margin-bottom: 10px;
    }

    /* ── Vehicle card ── */
    .vehicle-card {
      display: flex;
      align-items: center;
      gap: 14px;
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 12px 14px;
    }
    .vehicle-bus-img {
      width: 72px;
      height: 40px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .vehicle-bus-img svg {
      width: 72px;
      height: 40px;
    }
    .vehicle-details { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
    .vehicle-number { font-size: 14px; font-weight: 700; display: block; }
    .vehicle-meta-row {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .vehicle-meta-item { font-size: 12px; color: var(--color-text-muted); }
    .vehicle-sep { font-size: 12px; color: var(--color-border-strong); }
    .capacity-item { display: inline-flex; align-items: center; gap: 3px; }
    .cap-icon { font-size: 13px; width: 13px; height: 13px; color: var(--color-text-muted); }
    .no-data { font-size: 13px; margin: 0; }

    /* ── Journey ── */
    .journey-card {
      display: flex;
      flex-direction: column;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      overflow: hidden;
    }
    .journey-stop {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 14px;
      background: var(--color-surface);
    }
    .journey-connector {
      height: 1px;
      background: var(--color-border);
      margin: 0;
    }
    .stop-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 4px;
      border: 2px solid currentColor;
    }
    .stop-origin { color: var(--color-primary); background: var(--color-primary); }
    .stop-dest { color: var(--color-text-muted); background: transparent; border-color: var(--color-text-muted); }
    .stop-content { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .stop-name { font-size: 13.5px; font-weight: 600; }
    .stop-time { font-size: 11.5px; color: var(--color-text-muted); }
    .stop-badge {
      font-size: 12px;
      font-weight: 600;
      color: var(--color-text);
      white-space: nowrap;
      margin-top: 2px;
    }
    .stop-badge.muted { color: var(--color-text-muted); }

    /* ── Driver ── */
    .driver-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 20px;
      border-bottom: 1px solid var(--color-border);
    }
    .driver-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--color-primary-light);
      color: var(--color-primary-dark);
      font-size: 12px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .driver-name { font-size: 13px; font-weight: 600; flex: 1; }
    .driver-meta { font-size: 12px; }
    .driver-rating { font-size: 12px; font-weight: 600; color: #e6a817; white-space: nowrap; }

    /* ── Quick actions ── */
    .quick-actions {
      display: flex;
      flex-direction: column;
      padding: 10px 20px;
      border-bottom: 1px solid var(--color-border);
      gap: 2px;
    }
    .quick-action {
      display: flex;
      align-items: center;
      gap: 8px;
      background: none;
      border: none;
      color: var(--color-primary);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      padding: 7px 0;
      text-align: left;
      border-radius: var(--radius-sm);
    }
    .quick-action mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .quick-action.danger { color: var(--color-danger); }
    .quick-action:disabled { color: var(--color-text-faint); cursor: not-allowed; }
    .quick-action:not(:disabled):hover { opacity: 0.8; }

    /* ── Footer ── */
    .drawer-footer {
      margin-top: auto;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 20px;
      border-top: 1px solid var(--color-border);
      background: var(--color-surface);
    }
    .footer-action-icon {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border-strong);
      background: var(--color-surface);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--color-text-muted);
      flex-shrink: 0;
    }
    .footer-action-icon:hover { background: var(--color-bg); }
    .footer-action-icon mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .btn-cancel-booking {
      flex: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 600;
      padding: 8px 12px;
      border-radius: var(--radius-md);
      border: 1.5px solid var(--color-danger);
      background: transparent;
      color: var(--color-danger);
      cursor: pointer;
      transition: background 0.12s ease;
    }
    .btn-cancel-booking mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .btn-cancel-booking:hover:not(:disabled) { background: var(--color-danger-bg); }
    .btn-cancel-booking:disabled { opacity: 0.45; cursor: not-allowed; }

    .btn-edit-booking {
      flex: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 600;
      padding: 8px 12px;
      border-radius: var(--radius-md);
      border: none;
      background: var(--color-primary);
      color: #fff;
      cursor: pointer;
      transition: background 0.12s ease;
    }
    .btn-edit-booking mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .btn-edit-booking:hover { background: var(--color-primary-dark); }
  `],
})
export class BookingDetailsDrawerComponent {
  private driverService = inject(DriverService);
  private vehicleService = inject(VehicleService);

  booking = input<Booking | null>(null);

  @Output() close = new EventEmitter<void>();
  @Output() edit = new EventEmitter<Booking>();
  @Output() signInRider = new EventEmitter<string>();
  @Output() markNoShow = new EventEmitter<string>();
  @Output() cancelBooking = new EventEmitter<string>();

  driver = computed(() => this.driverService.getById(this.booking()?.driverId ?? null));
  vehicle = computed(() => this.vehicleService.getById(this.booking()?.vehicleId ?? null));

  isoToDisplay = isoToDisplay;
}
