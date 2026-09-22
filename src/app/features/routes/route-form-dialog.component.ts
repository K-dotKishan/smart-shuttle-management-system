import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ShuttleRoute } from '../../core/models';

export interface RouteFormDialogData {
  route?: ShuttleRoute;
}

@Component({
  selector: 'app-route-form-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.route ? 'Edit Route' : 'Add Route' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="form-grid">
        <mat-form-field appearance="outline">
          <mat-label>Route name</mat-label>
          <input matInput formControlName="name" required />
          @if (form.controls.name.invalid && form.controls.name.touched) {
            <mat-error>Route name is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="2"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Pickup point</mat-label>
          <input matInput formControlName="pickupPoint" required />
        </mat-form-field>

        <div class="stops-block">
          <label class="stops-label">Stops</label>
          @for (stop of stops.controls; track $index) {
            <div class="stop-row">
              <input class="stop-input" [formControl]="stopControl($index)" placeholder="Stop name" />
              <button class="icon-btn" type="button" (click)="removeStop($index)" aria-label="Remove stop">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          }
          <button class="btn" type="button" (click)="addStop()">
            <mat-icon>add</mat-icon> Add stop
          </button>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Drop-off point</mat-label>
          <input matInput formControlName="dropoffPoint" required />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Estimated duration (minutes)</mat-label>
          <input matInput type="number" min="1" formControlName="estimatedDurationMinutes" required />
        </mat-form-field>

        <mat-slide-toggle formControlName="active">Active</mat-slide-toggle>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button class="btn" mat-dialog-close type="button">Cancel</button>
        <button class="btn btn-primary" type="submit" [disabled]="form.invalid">Save Route</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [
    `
      .form-grid { display: flex; flex-direction: column; gap: 4px; min-width: 380px; }
      .stops-block { margin: 4px 0 12px; }
      .stops-label { font-size: 12px; color: var(--color-text-muted); display: block; margin-bottom: 6px; }
      .stop-row { display: flex; gap: 6px; align-items: center; margin-bottom: 6px; }
      .stop-input {
        flex: 1; border: 1px solid var(--color-border-strong); border-radius: var(--radius-md);
        padding: 7px 10px; font-size: 13px;
      }
      .icon-btn { border: none; background: transparent; cursor: pointer; color: var(--color-text-muted); width: 28px; height: 28px; border-radius: 6px; }
      .icon-btn:hover { background: var(--color-bg); }
      @media (max-width: 520px) { .form-grid { min-width: 0; } }
    `,
  ],
})
export class RouteFormDialogComponent {
  dialogRef = inject(MatDialogRef<RouteFormDialogComponent>);
  data = inject<RouteFormDialogData>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    name: [this.data.route?.name ?? '', Validators.required],
    description: [this.data.route?.description ?? ''],
    pickupPoint: [this.data.route?.pickupPoint ?? '', Validators.required],
    stops: this.fb.array((this.data.route?.stops ?? []).map((s) => this.fb.nonNullable.control(s))),
    dropoffPoint: [this.data.route?.dropoffPoint ?? '', Validators.required],
    estimatedDurationMinutes: [this.data.route?.estimatedDurationMinutes ?? 15, [Validators.required, Validators.min(1)]],
    active: [this.data.route?.active ?? true],
  });

  get stops(): FormArray {
    return this.form.controls.stops as FormArray;
  }

  stopControl(index: number) {
    return this.stops.at(index) as any;
  }

  addStop(): void {
    this.stops.push(this.fb.nonNullable.control(''));
  }

  removeStop(index: number): void {
    this.stops.removeAt(index);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    this.dialogRef.close({
      ...raw,
      stops: raw.stops.filter((s: string) => s.trim().length > 0),
    });
  }
}
