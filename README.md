<div align="center">

<img src="https://img.shields.io/badge/Angular-18-DD0031?style=for-the-badge&logo=angular&logoColor=white" />
<img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
<img src="https://img.shields.io/badge/Angular_Material-18-757575?style=for-the-badge&logo=angular&logoColor=white" />
<img src="https://img.shields.io/badge/RxJS-7-B7178C?style=for-the-badge&logo=reactivex&logoColor=white" />
<img src="https://img.shields.io/badge/Signals-Standalone-FF6B35?style=for-the-badge" />

<br/><br/>

# 🚌 Smart Campus Shuttle Management

### A modern, frontend-only enterprise dashboard for university campus shuttle operations

*Driver timelines · Employee journeys · Fleet management · Live analytics*

<br/>

</div>

---

## ✨ What is this?

A fully functional **Angular 18** SPA that models the day-to-day operations of a campus shuttle service — built with standalone components, Signals, and Angular Material. No backend. No server. All data lives in `localStorage` with deterministic seed data so it feels real on first load.

> 🗄️ **Frontend-only** — every save updates in-memory Signals and persists to `localStorage`. No server, no database, no auth API.

---

## 🎯 Features

<table>
<tr>
<td width="50%">

### 📊 Dashboard
- Live stat cards (trips, completed, active drivers, no-shows)
- Hourly demand bar chart with peak-hour highlight
- Driver availability panel
- Recent journeys table

### 🚌 Driver Management
- Visual horizontal duty timeline (06:00–22:00)
- Per-driver context menu: Start Duty / End Duty / Add Break
- Click any timeline block to edit or remove it
- Full Add / Edit / Deactivate driver CRUD

### 🗺️ Operations Hub (3 tabs)
- **Tracking** — live driver status cards + read-only timeline
- **Performance** — KPIs, driver leaderboard, booking breakdown
- **Management** — full driver timeline + journey table in one view

</td>
<td width="50%">

### 🎫 Journeys (Employee Journey View)
- Paginated table with debounced search
- Filters: status · date · route · driver
- Slide-in details drawer with vehicle card, journey route, driver info
- Actions: Sign Rider In · Mark No-show · Cancel · Edit

### 🛣️ Routes
- Card-based CRUD for campus shuttle routes
- Dynamic pickup / intermediate stops / drop-off

### 🚐 Vehicles
- Fleet table with status, capacity, assigned driver
- Duplicate vehicle number protection

### 📜 Trip History
- Searchable log of completed / cancelled / no-show trips
- Filter by date, driver, route, status

</td>
</tr>
</table>

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| 🅰️ **Framework** | Angular 18 — standalone components, no NgModules |
| 🔷 **Language** | TypeScript (strict-friendly) |
| ⚡ **State** | Angular Signals — `signal()`, `computed()` |
| 🌊 **Async** | RxJS — debounced search, `takeUntilDestroyed` |
| 🎨 **UI Components** | Angular Material (dialogs, menus, snackbar, tooltips) |
| 💅 **Styling** | Plain CSS with custom properties design system |
| 💾 **Persistence** | `localStorage` via typed `StorageService` wrapper |
| 🌐 **Routing** | Lazy-loaded routes via `loadComponent()` |

---

## 🏗️ Architecture

```
src/app/
├── 🧱 core/
│   ├── models/        Driver · Booking · Vehicle · Route · Trip
│   ├── services/      DriverService · BookingService · RouteService
│   │                  VehicleService · TripService · StorageService
│   └── data/          seed-data.ts — deterministic mock data builders
│
├── 🧩 shared/
│   └── components/    status-badge · page-header · stat-card
│                      search-bar · empty-state · confirm-dialog
│                      timeline-event
│
├── 🖼️ layout/
│   ├── shell/         App shell (sidebar + header + router-outlet)
│   ├── sidebar/       Collapsible dark navigation
│   └── header/        Top bar with notifications + admin menu
│
└── 📦 features/
    ├── dashboard/     Live operations overview
    ├── operations/    Tracking · Performance · Management tabs
    ├── drivers/       Timeline + dialogs
    ├── bookings/      Journey table + details drawer  ← Employee Journey View
    ├── routes/        Route CRUD
    ├── vehicles/      Fleet CRUD
    ├── trips/         Trip history log
    └── settings/      Admin profile + data reset
```

---

## ⚡ Angular Signals — How They're Used

```typescript
// Services expose readonly signals
readonly drivers = this._drivers.asReadonly();

// Derived state via computed()
readonly filteredBookings = computed(() =>
  this._bookings().filter(b => matchesAllFilters(b))
);

// Component-local UI state
selectedDate = signal(todayIso());
searchTerm   = signal('');
```

> `effect()` is deliberately **not** used for data sync — every mutation goes through an explicit service method that updates the signal and persists to `localStorage` in the same call.

---

## 🌊 RxJS — How It's Used

```typescript
// Debounced search — the canonical pattern
private readonly searchInput$ = new Subject<string>();

constructor() {
  this.searchInput$
    .pipe(debounceTime(250), distinctUntilChanged(), takeUntilDestroyed())
    .subscribe(term => this.searchTerm.set(term));
}
```

Everything else (filtering, pagination, aggregates) intentionally uses Signals rather than Observables.

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm start
# → http://localhost:4200

# Production build
npm run build
```

### Available commands

| Command | Description |
|---|---|
| `npm start` | `ng serve` — local dev at port 4200 |
| `npm run build` | Production build → `dist/shuttle-management/browser` |
| `npm run watch` | Dev build in watch mode |
| `npm test` | Karma/Jasmine test runner |

---

## 💾 Data & Persistence

`StorageService` is a typed `localStorage` wrapper (prefix `scsm:`) with try/catch guards so private browsing never crashes the app.

**Seed data includes:**
- 🧑‍✈️ **10 drivers** with varied online/duty/break statuses
- 🚌 **15 vehicles** across 4 types
- 🛣️ **8 campus routes** with stops
- 🎫 **20 bookings** for today across all statuses
- 📜 **24 trip history** records spread over the last 10 days
- 📅 **Multi-event driver schedules** (duty, pickup, drop, break, vehicle-change, empty-leg)

---

## 🎨 Design Decisions

**Why not Tailwind?**
> The sandboxed build environment makes Tailwind's JIT/PostCSS pipeline and CDN font inlining unreliable. Instead, a hand-written CSS custom-property design system (`styles.css`) gives the same enterprise SaaS look with zero external build-time dependencies.

**Why no `effect()` for persistence?**
> Every mutation is explicit: `service.update(id, changes)` → updates signal → writes to `localStorage`. This keeps data flow easy to trace and avoids the "who triggered this?" confusion that `effect()` can introduce.

**Booking ID format**
> Random 6-digit numbers (e.g. `123123`) rather than sequential IDs — matches the reference UI style and avoids collisions with seeded data.

---

## 🔮 Future Improvements

- [ ] 🔐 Real role-based auth once a backend exists
- [ ] 📈 Replace custom bar chart with Chart.js / D3 for richer tooltips
- [ ] 🔄 Optimistic conflict detection for multi-tab usage
- [ ] 🧪 Unit tests for service layer (signal updates, validators, availability logic)
- [ ] 📱 Virtualized tables for very large datasets
- [ ] 🗺️ Interactive campus map for live shuttle tracking

---

<div align="center">

Built with ❤️ using **Angular 18** · **Signals** · **Angular Material**

</div>
