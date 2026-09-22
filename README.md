# Smart Campus Shuttle Management System

A frontend-only enterprise dashboard for managing a university campus shuttle fleet — driver
duty timelines, bookings, routes, vehicles, and trip history. Built with **Angular 18**
(standalone components + Signals) and **Angular Material**.

> **This implementation is frontend-only and uses local mock data/localStorage instead of a
> backend.** There is no server, database, or authentication API — every "save" simply updates
> in-memory Signals and persists the result to the browser's `localStorage`.

---

## 1. Project overview

The app models the day-to-day operations of a campus shuttle service:

- Dispatchers can see which drivers are online, on duty, on break, or off duty, and edit their
  schedules on a visual timeline.
- Bookings move through a lifecycle (Requested → Accepted → On Going → Completed, or
  Declined/Cancelled/No Show) and can be created, edited, viewed in detail, and actioned
  (sign rider in, mark no-show, cancel).
- Admins manage the vehicle fleet and the campus routes those vehicles run.
- A dashboard summarizes today's operations and demand patterns; Trip History gives a
  searchable log of past trips.

## 2. Features

| Module | What it does |
|---|---|
| **Dashboard** | Live stat cards (today's trips, completed, active, available drivers, total bookings, no-shows), an hourly demand chart derived from booking + schedule data, today's driver availability list, and a recent bookings table. |
| **Driver Management** | Searchable driver roster, date-scoped horizontal duty timeline, per-driver context menu (Start Duty / End Duty / Add Break / Edit / Deactivate), click-to-edit timeline events, Add/Edit driver dialogs. |
| **Booking Management** | Enterprise data table with debounced search (RxJS), filters (status/date/route/driver), working pagination, Create/Edit booking forms with validation, and a right-side details drawer with Sign Rider / Mark No-show / Cancel / Edit actions. |
| **Route Management** | Card-based CRUD for shuttle routes with dynamic pickup/stop/drop-off lists and duplicate-name protection. |
| **Vehicle Management** | Fleet table with status, capacity, assigned driver, search/filter, CRUD with duplicate-number protection. |
| **Driver Assignment** | Built into the booking form — only drivers free in the requested time window and vehicles marked Available are selectable; conflicting selections are blocked with inline validation errors. |
| **Trip History** | Searchable, filterable log (date/driver/route/status) of past trips. |
| **Admin / Settings** | Mock admin profile, a summary of admin capabilities, and a "reset application data" action that clears `localStorage` and reseeds. |

## 3. Reference implementation notes

The two reference screenshots (driver timeline + context menu, and the booking drawer) were used
as the primary layout reference: a collapsible dark sidebar, a compact enterprise table with
status badges and a "Showing X-Y of Z items" pagination footer, a horizontally-scrollable duty
timeline with colored event blocks and a three-dot context menu, and a right-side drawer for
booking details with journey/vehicle/driver sections and rider actions at the bottom. The visual
language (white surfaces, subtle borders, blue primary, small badges) was reproduced generally
rather than pixel-matched, per the brief.

## 4. Tech stack

- Angular 18 (standalone components, no NgModules)
- TypeScript (strict-friendly, no unnecessary `any`)
- Angular Signals for local/application state
- RxJS for debounced search and reactive glue (`takeUntilDestroyed`, `Subject` + `debounceTime`)
- Angular Material (dialogs, menus, sidenav/drawer, form fields, snackbar, tooltips, slide toggle)
- Plain CSS design system with CSS custom properties (see "Design decisions" — Tailwind was
  evaluated and intentionally not used)
- Material Symbols icons via Angular Material's `mat-icon`

## 5. Architecture

```
src/app/
├── core/
│   ├── models/         Strongly-typed interfaces (Driver, Booking, Vehicle, Route, Trip, …)
│   ├── services/        DriverService, BookingService, RouteService, VehicleService,
│   │                    TripService, StorageService, NotificationService, time.util.ts
│   └── data/            seed-data.ts — deterministic mock/seed data builders
├── shared/
│   └── components/      Reusable UI: status-badge, page-header, stat-card, search-bar,
│                        empty-state, confirm-dialog, timeline-event
├── layout/
│   ├── shell/           Application shell (sidebar + header + router-outlet), responsive
│   ├── sidebar/         Collapsible navigation
│   └── header/          Top bar with mobile menu toggle + mock admin menu
└── features/
    ├── dashboard/
    ├── drivers/          Driver Management page + dialogs (form, duty actions, event editor)
    ├── bookings/         Booking Management page + dialogs (form, details drawer)
    ├── routes/           Route Management page + form dialog
    ├── vehicles/         Vehicle Management page + form dialog
    ├── trips/            Trip History page
    └── settings/         Admin/Settings page
```

Each feature route is lazy-loaded via `loadComponent()` in `app.routes.ts`, so the initial bundle
only contains the Dashboard; every other module downloads on navigation.

## 6. How Angular Signals are used

- Every service holds its core collection as a private `signal<T[]>`, exposed as
  `.asReadonly()` (e.g. `DriverService.drivers`, `BookingService.bookings`).
- Derived/filtered data is expressed with `computed()` — e.g.
  `BookingService.filteredBookings`, `.pagedBookings`, `.totalCount`, and dashboard-only
  aggregates like `completedCount` / `noShowCount`.
- UI-local state (search terms, filters, pagination index, selected date, selected booking,
  sidebar collapsed/mobile-open) is all plain `signal()` inside components — no NgRx/service
  needed for that.
- `effect()` was deliberately **not** used for data synchronization; every mutation goes through
  an explicit service method (`add`, `update`, `remove`, `startDuty`, …) that updates the signal
  and persists to `localStorage` in the same call, which keeps state changes easy to trace.

## 7. How RxJS is used

- **Debounced search**: `BookingService` exposes `onSearchInput(term)`, which pushes into a
  `Subject<string>` piped through `debounceTime(250)` + `distinctUntilChanged()` before updating
  the `searchTerm` signal — this is the canonical "RxJS for search" pattern the brief asked for.
- `takeUntilDestroyed()` is used to avoid manual subscription teardown/leaks.
- Everything else (filtering, pagination, computed aggregates) intentionally uses Signals rather
  than Observables, per the brief's guidance not to use RxJS just to claim it.

## 8. How localStorage is used

`StorageService` is a small typed wrapper around `window.localStorage` (prefix `scsm:`) with
try/catch guards so a private-browsing session or quota error never crashes the app. Each domain
service (`drivers`, `driverScheduleEvents`, `bookings`, `vehicles`, `routes`, `trips`) reads its
own key on startup — if data exists it's loaded as-is; if not, seed data is generated and written
back immediately. Every mutating service method re-persists the full updated array after updating
its signal, so a page refresh always reflects the latest state.

## 9. How mock data works

`core/data/seed-data.ts` builds deterministic mock data: 10 drivers, 15 vehicles, 8 routes, 20
bookings for "today", and 24 trip-history records spread over the last 10 days, plus multiple
duty/pickup/drop/break/vehicle-change schedule events per driver so the timeline is populated on
first load. IDs, times and statuses are generated procedurally (not hardcoded arrays of 20 near-
identical objects) so the app feels populated without being repetitive.

## 10. How to run the project

```bash
cd shuttle-management
npm install
npm start          # ng serve — http://localhost:4200
```

## 11. Production build

```bash
npm run build       # ng build --configuration production
```

Output is written to `dist/shuttle-management/browser`. This has been verified to build cleanly
with **zero TypeScript errors and zero budget warnings**.

## 12. Available npm commands

| Command | Description |
|---|---|
| `npm start` | Runs `ng serve` for local development |
| `npm run build` | Production build (see above) |
| `npm run watch` | Development build in watch mode |
| `npm test` | Runs the Karma/Jasmine unit test runner (scaffolded by the Angular CLI; this challenge focused on the application itself rather than test authoring) |

## 13. Design decisions

- **Tailwind CSS was evaluated but not included.** The brief allowed Tailwind "if compatible" —
  in this sandboxed build environment, outbound network access to the CDNs Tailwind's tooling
  and Google Fonts want to reach isn't available, which makes the JIT/PostCSS pipeline and font
  inlining unreliable in a fully offline build. Instead, a small hand-written design-token system
  (CSS custom properties in `styles.css`: colors, radii, shadows) plus per-component `styles: []`
  blocks was used to get the same "enterprise SaaS, no Tailwind bloat" look with zero external
  build-time dependencies. Angular's production build also had its **font-inlining optimization
  disabled** (`angular.json → optimization.fonts: false`) for the same reason — the Google Fonts
  `<link>` tags in `index.html` still work fine at runtime in a normal browser.
- **Right-side drawer** uses Angular Material's `<mat-sidenav>` in `mode="over"` rather than a
  hand-rolled overlay, so focus trapping/backdrop/escape-to-close come for free; on screens under
  640px it expands to full width to match the "full-screen on mobile" requirement.
- **Driver/vehicle availability** for booking assignment is computed on the fly
  (`DriverService.availableDriversForWindow`, `VehicleService.availableVehicles`) rather than
  stored redundantly, so it can never go stale relative to the schedule/fleet state.
- **Booking IDs** are generated as random 6-digit numbers (matching the screenshot's
  `123123`-style IDs) rather than sequential IDs, to avoid collisions with the seeded IDs.
- **Demand chart** blends today's driver-schedule pickup/drop events with bookings' requested
  pickup hours, so the "peak hour" highlight is genuinely derived from application state rather
  than a static array.

## 14. Future improvements

- Persist a "current admin" concept with real role-based permissions once a backend exists.
- Replace the custom bar chart on the Dashboard with a charting library (e.g. Chart.js) for
  richer tooltips/animation once bundle-size budget allows.
- Add optimistic conflict detection if the app is ever used in more than one browser tab
  (currently last-write-wins via `localStorage`).
- Add unit tests for the service layer (signal updates, validators, availability logic).
- Virtualize the booking/trip tables for very large seeded datasets.
