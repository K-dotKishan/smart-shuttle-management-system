import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SearchBarComponent } from '../../shared/components/search-bar/search-bar.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { TimelineEventComponent } from '../../shared/components/timeline-event/timeline-event.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { DriverService, NotificationService, VehicleService } from '../../core/services';
import { todayIso } from '../../core/services/time.util';
import { Driver, DriverScheduleEvent } from '../../core/models';
import { DriverFormDialogComponent } from './components/driver-form-dialog.component';
import {
  DutyActionDialogComponent,
  DutyActionDialogData,
  DutyActionResult,
} from './components/duty-action-dialog.component';
import {
  EventEditDialogComponent,
  EventEditDialogData,
} from './components/event-edit-dialog.component';

const TIMELINE_START = 6 * 60; // 06:00
const TIMELINE_END = 22 * 60; // 22:00
const PX_PER_MINUTE = 1.3;
const HOUR_MARKS = Array.from({ length: (TIMELINE_END - TIMELINE_START) / 60 + 1 }, (_, i) => TIMELINE_START + i * 60);

@Component({
  selector: 'app-driver-management',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    SearchBarComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    TimelineEventComponent,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
  ],
  template: `
    <app-page-header title="Driver Management" subtitle="Shift timeline, duty status and driver roster">
      <div actions class="header-actions">
        <input
          type="date"
          class="date-input"
          [value]="selectedDate()"
          (change)="onDateChange($event)"
          aria-label="Select date"
        />
        <button class="btn btn-primary" type="button" (click)="openAddDriver()">
          <mat-icon>add</mat-icon>
          Add Driver
        </button>
      </div>
    </app-page-header>

    <div class="card" style="margin-bottom: 16px;">
      <div class="toolbar">
        <app-search-bar placeholder="Search driver…" (search)="searchTerm.set($event)"></app-search-bar>
        <div class="filter-chips">
          <button
            class="chip"
            type="button"
            [class.active]="onlineFilter() === 'all'"
            (click)="onlineFilter.set('all')"
          >
            All
          </button>
          <button
            class="chip"
            type="button"
            [class.active]="onlineFilter() === 'online'"
            (click)="onlineFilter.set('online')"
          >
            Online
          </button>
          <button
            class="chip"
            type="button"
            [class.active]="onlineFilter() === 'offline'"
            (click)="onlineFilter.set('offline')"
          >
            Offline
          </button>
        </div>
      </div>

      @if (filteredDrivers().length === 0) {
        <app-empty-state
          icon="badge"
          title="No drivers match your search"
          description="Try a different name or clear the filters."
        ></app-empty-state>
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
                    <button mat-menu-item type="button" (click)="startDuty(driver)">
                      <mat-icon>login</mat-icon><span>Start Duty</span>
                    </button>
                    <button mat-menu-item type="button" (click)="endDuty(driver)">
                      <mat-icon>logout</mat-icon><span>End Duty</span>
                    </button>
                    <button mat-menu-item type="button" (click)="addBreak(driver)">
                      <mat-icon>free_breakfast</mat-icon><span>Add Break</span>
                    </button>
                    <button mat-menu-item type="button" (click)="openEditDriver(driver)">
                      <mat-icon>edit</mat-icon><span>Edit Driver</span>
                    </button>
                    <button mat-menu-item type="button" (click)="confirmDeleteDriver(driver)">
                      <mat-icon>person_off</mat-icon><span>Deactivate</span>
                    </button>
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
  `,
  styles: [
    `
      .header-actions { display: flex; gap: 10px; align-items: center; }
      .date-input {
        border: 1px solid var(--color-border-strong);
        border-radius: var(--radius-md);
        padding: 7px 10px;
        font-size: 13px;
        background: var(--color-surface);
        color: var(--color-text);
      }
      .toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 16px; flex-wrap: wrap; }
      .filter-chips { display: flex; gap: 6px; }
      .chip {
        border: 1px solid var(--color-border-strong);
        background: var(--color-surface);
        border-radius: 999px;
        padding: 5px 12px;
        font-size: 12.5px;
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
        position: sticky;
        left: 0;
        z-index: 2;
        background: var(--color-surface);
        width: 240px;
        min-width: 240px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
        padding: 10px 12px;
        border-right: 1px solid var(--color-border);
      }
      .header-row .sticky-col { background: #fafbfc; font-size: 11.5px; text-transform: uppercase; color: var(--color-text-muted); font-weight: 600; letter-spacing: .04em; }

      .driver-main { display: flex; align-items: center; gap: 8px; min-width: 0; }
      .driver-meta { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
      .driver-meta strong { font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px; }
      .avatar {
        width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
        background: var(--color-primary-light); color: var(--color-primary-dark);
        display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700;
      }
      .icon-btn { border: none; background: transparent; cursor: pointer; color: var(--color-text-muted); width: 28px; height: 28px; border-radius: 6px; flex-shrink: 0; }
      .icon-btn:hover { background: var(--color-bg); }

      .track { position: relative; height: 40px; }
      .header-track { height: 30px; }
      .hour-label { position: absolute; top: 6px; font-size: 11px; color: var(--color-text-faint); transform: translateX(-4px); }
      .grid-line { position: absolute; top: 0; bottom: 0; width: 1px; background: var(--color-border); }

      .legend { display: flex; flex-wrap: wrap; gap: 16px; padding: 12px 16px; border-top: 1px solid var(--color-border); font-size: 12px; color: var(--color-text-muted); }
      .legend .dot { display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin-right: 5px; vertical-align: middle; }
    `,
  ],
})
export class DriverManagementComponent {
  private driverService = inject(DriverService);
  private vehicleService = inject(VehicleService);
  private dialog = inject(MatDialog);
  private notifications = inject(NotificationService);

  selectedDate = signal(todayIso());
  searchTerm = signal('');
  onlineFilter = signal<'all' | 'online' | 'offline'>('all');

  timelineStart = TIMELINE_START;
  pxPerMinute = PX_PER_MINUTE;
  trackWidth = (TIMELINE_END - TIMELINE_START) * PX_PER_MINUTE;
  gridWidth = 240 + this.trackWidth;
  hourMarks = HOUR_MARKS;

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

  eventsFor(driverId: string): DriverScheduleEvent[] {
    return this.driverService.eventsForDriver(driverId, this.selectedDate());
  }

  hourLabel(minutes: number): string {
    const h = Math.floor(minutes / 60);
    return `${String(h).padStart(2, '0')}:00`;
  }

  onDateChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (value) this.selectedDate.set(value);
  }

  openAddDriver(): void {
    const ref = this.dialog.open(DriverFormDialogComponent, { data: {}, width: '440px' });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.driverService.add({
        ...result,
        dutyStatus: 'off-duty',
        currentVehicleId: null,
        rating: 4.8,
        joinedDate: todayIso(),
      });
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
    const data: ConfirmDialogData = {
      title: 'Deactivate driver?',
      message: `${driver.name} will be marked inactive and removed from active rosters. This can be reversed later by an admin.`,
      confirmLabel: 'Deactivate',
      danger: true,
    };
    const ref = this.dialog.open(ConfirmDialogComponent, { data, width: '420px' });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.driverService.deactivate(driver.id);
      this.notifications.success(`${driver.name} deactivated.`);
    });
  }

  startDuty(driver: Driver): void {
    const data: DutyActionDialogData = { mode: 'start-duty', driverName: driver.name };
    const ref = this.dialog.open(DutyActionDialogComponent, { data, width: '380px' });
    ref.afterClosed().subscribe((result: DutyActionResult | undefined) => {
      if (!result) return;
      this.driverService.startDuty(driver.id, this.selectedDate(), result.startMinutes!, result.endMinutes, result.notes);
      this.notifications.success(`Duty started for ${driver.name}.`);
    });
  }

  endDuty(driver: Driver): void {
    const data: DutyActionDialogData = { mode: 'end-duty', driverName: driver.name };
    const ref = this.dialog.open(DutyActionDialogComponent, { data, width: '380px' });
    ref.afterClosed().subscribe((result: DutyActionResult | undefined) => {
      if (!result) return;
      this.driverService.endDuty(driver.id, this.selectedDate(), result.endMinutes);
      this.notifications.success(`Duty ended for ${driver.name}.`);
    });
  }

  addBreak(driver: Driver): void {
    const data: DutyActionDialogData = { mode: 'add-break', driverName: driver.name };
    const ref = this.dialog.open(DutyActionDialogComponent, { data, width: '380px' });
    ref.afterClosed().subscribe((result: DutyActionResult | undefined) => {
      if (!result) return;
      this.driverService.addBreak(driver.id, this.selectedDate(), result.startMinutes!, result.endMinutes, result.notes);
      this.notifications.success(`Break added for ${driver.name}.`);
    });
  }

  openEditEvent(driver: Driver, event: DriverScheduleEvent): void {
    const data: EventEditDialogData = { event, driverName: driver.name };
    const ref = this.dialog.open(EventEditDialogComponent, { data, width: '380px' });
    ref.afterClosed().subscribe((result) => {
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
}
