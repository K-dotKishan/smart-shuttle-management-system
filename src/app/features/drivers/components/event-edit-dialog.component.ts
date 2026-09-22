import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { DriverScheduleEvent, ScheduleEventType } from '../../../core/models';
import { fromMinutes, toMinutes } from '../../../core/services/time.util';

export interface EventEditDialogData {
  event: DriverScheduleEvent;
  driverName: string;
}

const EVENT_TYPES: ScheduleEventType[] = ['duty', 'break', 'pickup', 'drop', 'vehicle-change', 'empty-leg'];

@Component({
  selector: 'app-event-edit-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>Edit Timeline Event</h2>
    <p class="text-muted subtitle">{{ data.driverName }}</p>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="form-grid">
        <mat-form-field appearance="outline">
          <mat-label>Type</mat-label>
          <mat-select formControlName="type">
            @for (t of eventTypes; track t) {
              <mat-option [value]="t">{{ t }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Start time</mat-label>
          <input matInput type="time" formControlName="start" required />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>End time</mat-label>
          <input matInput type="time" formControlName="end" required />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Notes</mat-label>
          <textarea matInput formControlName="notes" rows="2"></textarea>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button class="btn btn-danger" type="button" (click)="dialogRef.close({ action: 'delete' })">Remove</button>
        <span style="flex: 1"></span>
        <button class="btn" mat-dialog-close type="button">Cancel</button>
        <button class="btn btn-primary" type="submit" [disabled]="form.invalid">Save</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [
    `
      .form-grid { display: flex; flex-direction: column; gap: 4px; min-width: 300px; }
      .subtitle { margin: -8px 0 4px; padding: 0 24px; }
      mat-dialog-actions { display: flex; }
    `,
  ],
})
export class EventEditDialogComponent {
  dialogRef = inject(MatDialogRef<EventEditDialogComponent>);
  data = inject<EventEditDialogData>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);

  eventTypes = EVENT_TYPES;

  form = this.fb.nonNullable.group({
    type: [this.data.event.type, Validators.required],
    start: [fromMinutes(this.data.event.startMinutes), Validators.required],
    end: [fromMinutes(this.data.event.endMinutes), Validators.required],
    notes: [this.data.event.notes ?? ''],
  });

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { type, start, end, notes } = this.form.getRawValue();
    this.dialogRef.close({
      action: 'save',
      changes: {
        type,
        startMinutes: toMinutes(start),
        endMinutes: toMinutes(end),
        notes,
        label: type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' '),
      },
    });
  }
}
