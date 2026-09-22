import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Driver } from '../../../core/models';

export interface DriverFormDialogData {
  driver?: Driver;
}

@Component({
  selector: 'app-driver-form-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.driver ? 'Edit Driver' : 'Add Driver' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="form-grid">
        <mat-form-field appearance="outline">
          <mat-label>Full name</mat-label>
          <input matInput formControlName="name" required />
          @if (form.controls.name.invalid && form.controls.name.touched) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Phone</mat-label>
          <input matInput formControlName="phone" required />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Email</mat-label>
          <input matInput type="email" formControlName="email" required />
          @if (form.controls.email.invalid && form.controls.email.touched) {
            <mat-error>Enter a valid email</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>License number</mat-label>
          <input matInput formControlName="licenseNumber" required />
        </mat-form-field>

        <div class="toggle-row">
          <mat-slide-toggle formControlName="online">Online</mat-slide-toggle>
          <mat-slide-toggle formControlName="active">Active</mat-slide-toggle>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button class="btn" mat-dialog-close type="button">Cancel</button>
        <button class="btn btn-primary" type="submit" [disabled]="form.invalid">Save Driver</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [
    `
      .form-grid { display: flex; flex-direction: column; gap: 4px; min-width: 320px; }
      .toggle-row { display: flex; gap: 24px; margin: 8px 0 12px; }
    `,
  ],
})
export class DriverFormDialogComponent {
  dialogRef = inject(MatDialogRef<DriverFormDialogComponent>);
  data = inject<DriverFormDialogData>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    name: [this.data.driver?.name ?? '', Validators.required],
    phone: [this.data.driver?.phone ?? '', Validators.required],
    email: [this.data.driver?.email ?? '', [Validators.required, Validators.email]],
    licenseNumber: [this.data.driver?.licenseNumber ?? '', Validators.required],
    online: [this.data.driver?.online ?? false],
    active: [this.data.driver?.active ?? true],
  });

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close(this.form.getRawValue());
  }
}
