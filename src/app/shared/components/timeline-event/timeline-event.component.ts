import { ChangeDetectionStrategy, Component, EventEmitter, Output, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DriverScheduleEvent } from '../../../core/models';
import { fromMinutes } from '../../../core/services/time.util';

const TYPE_ICON: Record<string, string> = {
  duty: 'login',
  break: 'free_breakfast',
  pickup: 'location_on',
  drop: 'location_on',
  'vehicle-change': 'sync_alt',
  'empty-leg': 'logout',
};

const TYPE_CLASS: Record<string, string> = {
  duty: 'evt-duty',
  break: 'evt-break',
  pickup: 'evt-pickup',
  drop: 'evt-drop',
  'vehicle-change': 'evt-vehicle',
  'empty-leg': 'evt-empty',
};

/** One positioned block on the driver timeline. Pixels-per-minute driven so
 * the whole grid can scroll horizontally on small screens. */
@Component({
  selector: 'app-timeline-event',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatTooltipModule],
  template: `
    <button
      type="button"
      class="evt"
      [class]="typeClass()"
      [style.left.px]="left()"
      [style.width.px]="width()"
      [matTooltip]="tooltip()"
      (click)="select.emit()"
      [attr.aria-label]="tooltip()"
    >
      <mat-icon>{{ icon() }}</mat-icon>
    </button>
  `,
  styles: [
    `
      .evt {
        position: absolute;
        top: 6px;
        height: 28px;
        border-radius: 5px;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        min-width: 20px;
        padding: 0;
      }
      .evt mat-icon { font-size: 15px; width: 15px; height: 15px; }
      .evt-duty { background: #2f5fdb; }
      .evt-break { background: #a15c00; }
      .evt-pickup { background: #c14fa3; }
      .evt-drop { background: #7a4fd9; }
      .evt-vehicle { background: #1b8f8f; }
      .evt-empty { background: #6b7280; }
      .evt:hover { filter: brightness(0.92); }
      .evt:focus-visible { outline: 2px solid #101828; outline-offset: 2px; }
    `,
  ],
})
export class TimelineEventComponent {
  event = input.required<DriverScheduleEvent>();
  pxPerMinute = input<number>(2);
  timelineStartMinutes = input<number>(360);

  @Output() select = new EventEmitter<void>();

  left = computed(
    () => (this.event().startMinutes - this.timelineStartMinutes()) * this.pxPerMinute()
  );
  width = computed(() =>
    Math.max((this.event().endMinutes - this.event().startMinutes) * this.pxPerMinute(), 18)
  );
  icon = computed(() => TYPE_ICON[this.event().type] ?? 'circle');
  typeClass = computed(() => TYPE_CLASS[this.event().type] ?? 'evt-empty');
  tooltip = computed(() => {
    const e = this.event();
    return `${e.label} · ${fromMinutes(e.startMinutes)}–${fromMinutes(e.endMinutes)}${e.notes ? ' · ' + e.notes : ''}`;
  });
}
