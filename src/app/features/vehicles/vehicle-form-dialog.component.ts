import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Vehicle, VehicleStatus } from '../../core/models';
import { DriverService } from '../../core/services';

export interface VehicleFormDialogData {
  vehicle?: Vehicle;
}

const STATUS_OPTIONS: VehicleStatus[] = ['Available', 'In Use', 'Maintenance', 'Inactive'];

@Component({
  selector: 'app-vehicle-form-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.vehicle ? 'Edit Vehicle' : 'Add Vehicle' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="form-grid">
        <mat-form-field appearance="outline">
          <mat-label>Vehicle number</mat-label>
          <input matInput formControlName="vehicleNumber" required />
          @if (form.controls.vehicleNumber.invalid && form.controls.vehicleNumber.touched) {
            <mat-error>Vehicle number is required</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Registration number</mat-label>
          <input matInput formControlName="registrationNumber" required />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Vehicle type</mat-label>
          <input matInput formControlName="vehicleType" required />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Capacity (seats)</mat-label>
          <input matInput type="number" min="1" formControlName="capacity" required />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select formControlName="status">
            @for (s of statusOptions; track s) { <mat-option [value]="s">{{ s }}</mat-option> }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Assigned driver</mat-label>
          <mat-select formControlName="assignedDriverId">
            <mat-option [value]="null">Unassigned</mat-option>
            @for (d of driverService.activeDrivers(); track d.id) { <mat-option [value]="d.id">{{ d.name }}</mat-option> }
          </mat-select>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button class="btn" mat-dialog-close type="button">Cancel</button>
        <button class="btn btn-primary" type="submit" [disabled]="form.invalid">Save Vehicle</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`.form-grid { display: flex; flex-direction: column; gap: 4px; min-width: 360px; } @media (max-width: 520px) { .form-grid { min-width: 0; } }`],
})
export class VehicleFormDialogComponent {
  dialogRef = inject(MatDialogRef<VehicleFormDialogComponent>);
  data = inject<VehicleFormDialogData>(MAT_DIALOG_DATA);
  driverService = inject(DriverService);
  private fb = inject(FormBuilder);

  statusOptions = STATUS_OPTIONS;

  form = this.fb.nonNullable.group({
    vehicleNumber: [this.data.vehicle?.vehicleNumber ?? '', Validators.required],
    registrationNumber: [this.data.vehicle?.registrationNumber ?? '', Validators.required],
    vehicleType: [this.data.vehicle?.vehicleType ?? '', Validators.required],
    capacity: [this.data.vehicle?.capacity ?? 12, [Validators.required, Validators.min(1)]],
    status: [this.data.vehicle?.status ?? ('Available' as VehicleStatus)],
    assignedDriverId: [this.data.vehicle?.assignedDriverId ?? null],
  });

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close(this.form.getRawValue());
  }
}
