import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { toMinutes } from '../../../core/services/time.util';

export type DutyActionMode = 'start-duty' | 'end-duty' | 'add-break';

export interface DutyActionDialogData {
  mode: DutyActionMode;
  driverName: string;
}

export interface DutyActionResult {
  startMinutes?: number;
  endMinutes: number;
  notes: string;
}

@Component({
  selector: 'app-duty-action-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ title }}</h2>
    <p class="text-muted subtitle">{{ data.driverName }}</p>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="form-grid">
        @if (data.mode !== 'end-duty') {
          <mat-form-field appearance="outline">
            <mat-label>{{ data.mode === 'start-duty' ? 'Start time' : 'Break start' }}</mat-label>
            <input matInput type="time" formControlName="start" required />
          </mat-form-field>
        }
        <mat-form-field appearance="outline">
          <mat-label>{{ endLabel }}</mat-label>
          <input matInput type="time" formControlName="end" required />
        </mat-form-field>
        @if (form.errors?.['order'] && (form.controls.end.touched || form.controls.start.touched)) {
          <p class="error-text">End time must be after start time.</p>
        }
        <mat-form-field appearance="outline">
          <mat-label>{{ data.mode === 'add-break' ? 'Reason' : 'Notes' }}</mat-label>
          <textarea matInput formControlName="notes" rows="2"></textarea>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button class="btn" mat-dialog-close type="button">Cancel</button>
        <button class="btn btn-primary" type="submit" [disabled]="form.invalid">Save</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [
    `
      .form-grid { display: flex; flex-direction: column; gap: 4px; min-width: 300px; }
      .subtitle { margin: -8px 0 4px; padding: 0 24px; }
      .error-text { color: var(--color-danger); font-size: 12px; margin: -6px 0 8px; }
    `,
  ],
})
export class DutyActionDialogComponent {
  dialogRef = inject(MatDialogRef<DutyActionDialogComponent>);
  data = inject<DutyActionDialogData>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);

  form = this.fb.nonNullable.group(
    {
      start: ['08:00'],
      end: ['17:00'],
      notes: [''],
    },
    { validators: [(group: any) => this.orderValidator(group)] }
  );

  get title(): string {
    switch (this.data.mode) {
      case 'start-duty':
        return 'Start Duty';
      case 'end-duty':
        return 'End Duty';
      default:
        return 'Add Break';
    }
  }

  get endLabel(): string {
    if (this.data.mode === 'start-duty') return 'Expected end time';
    if (this.data.mode === 'end-duty') return 'End time';
    return 'Break end';
  }

  private orderValidator(group: any) {
    if (this.data.mode === 'end-duty') return null;
    if (group.value.start && group.value.end && toMinutes(group.value.end) <= toMinutes(group.value.start)) {
      return { order: true };
    }
    return null;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { start, end, notes } = this.form.getRawValue();
    const result: DutyActionResult = {
      startMinutes: this.data.mode !== 'end-duty' ? toMinutes(start) : undefined,
      endMinutes: toMinutes(end),
      notes,
    };
    this.dialogRef.close(result);
  }
}
