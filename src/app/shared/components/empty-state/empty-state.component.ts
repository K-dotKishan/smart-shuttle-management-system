import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="state-block" role="status">
      <mat-icon>{{ icon() }}</mat-icon>
      <div>
        <strong>{{ title() }}</strong>
        @if (description()) {
          <p class="text-muted" style="margin: 4px 0 0;">{{ description() }}</p>
        }
      </div>
      <ng-content></ng-content>
    </div>
  `,
})
export class EmptyStateComponent {
  icon = input<string>('inbox');
  title = input<string>('Nothing here yet');
  description = input<string>('');
}
