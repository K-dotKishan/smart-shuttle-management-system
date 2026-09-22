import { ChangeDetectionStrategy, Component, EventEmitter, input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatIconModule],
  template: `
    <label class="search-bar" [attr.aria-label]="placeholder()">
      <mat-icon>search</mat-icon>
      <input
        type="text"
        [placeholder]="placeholder()"
        [ngModel]="value"
        (ngModelChange)="onInput($event)"
      />
    </label>
  `,
  styles: [
    `
      .search-bar {
        display: flex;
        align-items: center;
        gap: 6px;
        background: var(--color-surface);
        border: 1px solid var(--color-border-strong);
        border-radius: var(--radius-md);
        padding: 6px 10px;
        min-width: 220px;
      }
      .search-bar mat-icon { font-size: 18px; width: 18px; height: 18px; color: var(--color-text-faint); }
      .search-bar input {
        border: none;
        outline: none;
        font-size: 13px;
        flex: 1;
        background: transparent;
        color: var(--color-text);
      }
    `,
  ],
})
export class SearchBarComponent {
  placeholder = input<string>('Search…');
  value = '';

  @Output() search = new EventEmitter<string>();

  onInput(val: string): void {
    this.value = val;
    this.search.emit(val);
  }
}
