import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    <div class="shell">
      <div
        class="sidebar-wrap"
        [class.mobile-open]="mobileNavOpen()"
      >
        <app-sidebar
          [collapsed]="collapsed()"
          (toggleCollapse)="collapsed.set(!collapsed())"
          (navigate)="mobileNavOpen.set(false)"
        ></app-sidebar>
      </div>

      @if (mobileNavOpen()) {
        <button class="scrim" type="button" aria-label="Close navigation" (click)="mobileNavOpen.set(false)"></button>
      }

      <div class="main-col">
        <app-header (menuClick)="mobileNavOpen.set(!mobileNavOpen())"></app-header>
        <main class="main-content" id="main-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [
    `
      .shell {
        display: flex;
        height: 100vh;
        overflow: hidden;
      }
      .sidebar-wrap { flex-shrink: 0; }
      .main-col { flex: 1; min-width: 0; display: flex; flex-direction: column; }
      .main-content {
        flex: 1;
        overflow-y: auto;
        padding: 24px;
        background: var(--color-bg);
      }
      .scrim { display: none; }

      @media (max-width: 900px) {
        .sidebar-wrap {
          position: fixed;
          inset: 0 auto 0 0;
          z-index: 40;
          transform: translateX(-100%);
          transition: transform 0.18s ease;
        }
        .sidebar-wrap.mobile-open { transform: translateX(0); }
        .scrim {
          display: block;
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.4);
          border: none;
          z-index: 30;
        }
        .main-content { padding: 16px; }
      }
    `,
  ],
})
export class ShellComponent {
  collapsed = signal(false);
  mobileNavOpen = signal(false);
}
