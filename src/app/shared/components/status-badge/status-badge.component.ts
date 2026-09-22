import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const STATUS_TONE_MAP: Record<string, BadgeTone> = {
  Accepted: 'info',
  Waiting: 'warning',
  'No Show': 'danger',
  Declined: 'neutral',
  Completed: 'success',
  Requested: 'info',
  'On Going': 'warning',
  Cancelled: 'danger',
  Dropped: 'success',
  Available: 'success',
  'In Use': 'info',
  Maintenance: 'warning',
  Inactive: 'neutral',
  Online: 'success',
  Offline: 'neutral',
  'on-duty': 'success',
  'off-duty': 'neutral',
  'on-break': 'warning',
};

/** Small reusable status pill. Pass any known status string and it colors itself. */
@Component({
  selector: 'app-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="badge" [class]="'badge-' + tone()">{{ label() }}</span>`,
})
export class StatusBadgeComponent {
  status = input.required<string>();
  toneOverride = input<BadgeTone | undefined>(undefined);

  label = computed(() => this.status());
  tone = computed<BadgeTone>(() => this.toneOverride() ?? STATUS_TONE_MAP[this.status()] ?? 'neutral');
}
