import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Booking, BookingStatus } from '../../../core/models';
import { DriverService, RouteService, VehicleService } from '../../../core/services';
import { toMinutes } from '../../../core/services/time.util';

export interface BookingFormDialogData {
  booking?: Booking;
}

const LOCATIONS = ['Library', 'Data Centre', 'Parking', 'Hostel Block 1', 'Cafeteria', 'Main Gate', 'Admin Block', 'Sports Complex', 'Hostel Block 2'];
const STATUS_OPTIONS: BookingStatus[] = [
  'Requested', 'Accepted', 'Waiting', 'On Going', 'Completed', 'No Show', 'Declined', 'Cancelled', 'Dropped',
];

@Component({
  selector: 'app-booking-form-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Edit Booking' : 'Create Booking' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="form-grid">
        <mat-form-field appearance="outline">
          <mat-label>Employee name</mat-label>
          <input matInput formControlName="employeeName" required />
          @if (form.controls.employeeName.invalid && form.controls.employeeName.touched) {
            <mat-error>Employee name is required</mat-error>
          }
        </mat-form-field>

        <div class="row-2">
          <mat-form-field appearance="outline">
            <mat-label>From</mat-label>
            <mat-select formControlName="fromLocation" required>
              @for (loc of locations; track loc) { <mat-option [value]="loc">{{ loc }}</mat-option> }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>To</mat-label>
            <mat-select formControlName="toLocation" required>
              @for (loc of locations; track loc) { <mat-option [value]="loc">{{ loc }}</mat-option> }
            </mat-select>
          </mat-form-field>
        </div>
        @if (form.errors?.['sameLocation']) {
          <p class="error-text">Pickup and drop locations cannot be identical.</p>
        }

        <div class="row-2">
          <mat-form-field appearance="outline">
            <mat-label>Date</mat-label>
            <input matInput type="date" formControlName="date" required />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Requested pickup time</mat-label>
            <input matInput type="time" formControlName="requestedPickupTime" required />
          </mat-form-field>
        </div>

        @if (isEdit) {
          <div class="row-2">
            <mat-form-field appearance="outline">
              <mat-label>Actual pickup time</mat-label>
              <input matInput type="time" formControlName="actualPickupTime" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Planned drop</mat-label>
              <input matInput type="time" formControlName="plannedDropTime" />
            </mat-form-field>
          </div>
          <mat-form-field appearance="outline">
            <mat-label>Status</mat-label>
            <mat-select formControlName="status">
              @for (s of statusOptions; track s) { <mat-option [value]="s">{{ s }}</mat-option> }
            </mat-select>
          </mat-form-field>
        }

        <div class="row-2">
          <mat-form-field appearance="outline">
            <mat-label>Vehicle</mat-label>
            <mat-select formControlName="vehicleId">
              <mat-option [value]="null">Unassigned</mat-option>
              @for (v of availableVehicles(); track v.id) {
                <mat-option [value]="v.id">{{ v.vehicleNumber }} · {{ v.vehicleType }}</mat-option>
              }
            </mat-select>
            @if (form.errors?.['vehicleUnavailable']) {
              <mat-hint class="error-hint">Selected vehicle is not available.</mat-hint>
            }
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Driver</mat-label>
            <mat-select formControlName="driverId">
              <mat-option [value]="null">Unassigned</mat-option>
              @for (d of availableDrivers(); track d.id) {
                <mat-option [value]="d.id">{{ d.name }}</mat-option>
              }
            </mat-select>
            @if (form.errors?.['driverUnavailable']) {
              <mat-hint class="error-hint">Selected driver is not available for this time.</mat-hint>
            }
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Notes</mat-label>
          <textarea matInput formControlName="notes" rows="2"></textarea>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button class="btn" mat-dialog-close type="button">Cancel</button>
        <button class="btn btn-primary" type="submit" [disabled]="form.invalid">
          {{ isEdit ? 'Save Changes' : 'Create Booking' }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [
    `
      .form-grid { display: flex; flex-direction: column; gap: 2px; min-width: 380px; }
      .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      .error-text { color: var(--color-danger); font-size: 12px; margin: -6px 0 8px; }
      .error-hint { color: var(--color-danger); }
      @media (max-width: 520px) {
        .form-grid { min-width: 0; }
        .row-2 { grid-template-columns: 1fr; }
      }
    `,
  ],
})
export class BookingFormDialogComponent {
  dialogRef = inject(MatDialogRef<BookingFormDialogComponent>);
  data = inject<BookingFormDialogData>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private driverService = inject(DriverService);
  private vehicleService = inject(VehicleService);
  private routeService = inject(RouteService);

  locations = LOCATIONS;
  statusOptions = STATUS_OPTIONS;
  isEdit = !!this.data.booking;

  form = this.fb.nonNullable.group(
    {
      employeeName: [this.data.booking?.employeeName ?? '', Validators.required],
      employeeId: [this.data.booking?.employeeId ?? `EMP-${Math.floor(1000 + Math.random() * 9000)}`],
      fromLocation: [this.data.booking?.fromLocation ?? '', Validators.required],
      toLocation: [this.data.booking?.toLocation ?? '', Validators.required],
      date: [this.data.booking?.date ?? new Date().toISOString().slice(0, 10), Validators.required],
      requestedPickupTime: [this.data.booking?.requestedPickupTime ?? '09:00', Validators.required],
      actualPickupTime: [this.data.booking?.actualPickupTime ?? ''],
      plannedDropTime: [this.data.booking?.plannedDropTime ?? ''],
      status: [this.data.booking?.status ?? ('Requested' as BookingStatus)],
      vehicleId: [this.data.booking?.vehicleId ?? null],
      driverId: [this.data.booking?.driverId ?? null],
      notes: [this.data.booking?.notes ?? ''],
    },
    { validators: [(g) => this.crossFieldValidator(g)] }
  );

  // Signals mirroring form controls so template can react to date/time changes for availability lists
  private dateSig = signal(this.form.controls.date.value);
  private timeSig = signal(this.form.controls.requestedPickupTime.value);

  constructor() {
    this.form.controls.date.valueChanges.subscribe((v) => this.dateSig.set(v));
    this.form.controls.requestedPickupTime.valueChanges.subscribe((v) => this.timeSig.set(v));
  }

  availableDrivers = computed(() => {
    const date = this.dateSig();
    const time = this.timeSig();
    if (!date || !time) return this.driverService.activeDrivers();
    const start = toMinutes(time);
    const list = this.driverService.availableDriversForWindow(date, start, start + 30);
    // Always include the currently-assigned driver so editing doesn't hide it
    const currentId = this.data.booking?.driverId;
    if (currentId && !list.some((d) => d.id === currentId)) {
      const current = this.driverService.getById(currentId);
      if (current) return [current, ...list];
    }
    return list;
  });

  availableVehicles = computed(() => {
    const list = this.vehicleService.availableVehicles();
    const currentId = this.data.booking?.vehicleId;
    if (currentId && !list.some((v) => v.id === currentId)) {
      const current = this.vehicleService.getById(currentId);
      if (current) return [current, ...list];
    }
    return list;
  });

  private crossFieldValidator(group: AbstractControl): ValidationErrors | null {
    const errors: ValidationErrors = {};
    const from = group.get('fromLocation')?.value;
    const to = group.get('toLocation')?.value;
    if (from && to && from === to) errors['sameLocation'] = true;

    const vehicleId = group.get('vehicleId')?.value;
    if (vehicleId) {
      const vehicle = this.vehicleService.getById(vehicleId);
      const isCurrent = vehicleId === this.data.booking?.vehicleId;
      if (vehicle && vehicle.status !== 'Available' && !isCurrent) {
        errors['vehicleUnavailable'] = true;
      }
    }

    const driverId = group.get('driverId')?.value;
    const date = group.get('date')?.value;
    const time = group.get('requestedPickupTime')?.value;
    if (driverId && date && time) {
      const start = toMinutes(time);
      const isCurrent = driverId === this.data.booking?.driverId;
      const availableIds = this.driverService.availableDriversForWindow(date, start, start + 30).map((d) => d.id);
      if (!availableIds.includes(driverId) && !isCurrent) {
        errors['driverUnavailable'] = true;
      }
    }

    return Object.keys(errors).length ? errors : null;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    this.dialogRef.close({
      ...raw,
      actualPickupTime: raw.actualPickupTime || null,
      plannedDropTime: raw.plannedDropTime || null,
      routeId: this.inferRouteId(raw.fromLocation, raw.toLocation) ?? this.data.booking?.routeId ?? null,
      actualDropTime: this.data.booking?.actualDropTime ?? null,
    });
  }

  private inferRouteId(from: string, to: string): string | null {
    const match = this.routeService
      .routes()
      .find((r) => r.pickupPoint === from && r.dropoffPoint === to);
    return match?.id ?? null;
  }
}
