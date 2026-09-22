import { Injectable, computed, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Booking, BookingStatus } from '../models';
import { StorageService } from './storage.service';
import { buildSeedBookings } from '../data/seed-data';
import { VehicleService } from './vehicle.service';
import { DriverService } from './driver.service';

const KEY = 'bookings';

export interface BookingFilters {
  search: string;
  status: BookingStatus | 'All';
  date: string | 'All';
  routeId: string | 'All';
  driverId: string | 'All';
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private storage = inject(StorageService);
  private vehicleService = inject(VehicleService);
  private driverService = inject(DriverService);

  private readonly _bookings = signal<Booking[]>(this.load());
  readonly bookings = this._bookings.asReadonly();

  // --- Search (RxJS, debounced) ---
  private readonly searchInput$ = new Subject<string>();
  readonly searchTerm = signal('');

  // --- Filters (Signals) ---
  readonly statusFilter = signal<BookingStatus | 'All'>('All');
  readonly dateFilter = signal<string | 'All'>('All');
  readonly routeFilter = signal<string | 'All'>('All');
  readonly driverFilter = signal<string | 'All'>('All');

  // --- Pagination (Signals) ---
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);

  readonly filteredBookings = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const status = this.statusFilter();
    const date = this.dateFilter();
    const routeId = this.routeFilter();
    const driverId = this.driverFilter();

    return this._bookings().filter((b) => {
      if (term) {
        const matches =
          b.id.toLowerCase().includes(term) || b.employeeName.toLowerCase().includes(term);
        if (!matches) return false;
      }
      if (status !== 'All' && b.status !== status) return false;
      if (date !== 'All' && b.date !== date) return false;
      if (routeId !== 'All' && b.routeId !== routeId) return false;
      if (driverId !== 'All' && b.driverId !== driverId) return false;
      return true;
    });
  });

  readonly pagedBookings = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filteredBookings().slice(start, start + this.pageSize());
  });

  readonly totalCount = computed(() => this.filteredBookings().length);

  readonly todayCount = computed(() => this._bookings().length);
  readonly completedCount = computed(
    () => this._bookings().filter((b) => b.status === 'Completed' || b.status === 'Dropped').length
  );
  readonly activeCount = computed(
    () => this._bookings().filter((b) => b.status === 'On Going' || b.status === 'Accepted').length
  );
  readonly noShowCount = computed(() => this._bookings().filter((b) => b.status === 'No Show').length);

  constructor() {
    this.searchInput$
      .pipe(debounceTime(250), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((term) => {
        this.searchTerm.set(term);
        this.pageIndex.set(0);
      });
  }

  onSearchInput(term: string): void {
    this.searchInput$.next(term);
  }

  setStatusFilter(status: BookingStatus | 'All'): void {
    this.statusFilter.set(status);
    this.pageIndex.set(0);
  }

  setDateFilter(date: string | 'All'): void {
    this.dateFilter.set(date);
    this.pageIndex.set(0);
  }

  setRouteFilter(routeId: string | 'All'): void {
    this.routeFilter.set(routeId);
    this.pageIndex.set(0);
  }

  setDriverFilter(driverId: string | 'All'): void {
    this.driverFilter.set(driverId);
    this.pageIndex.set(0);
  }

  setPage(index: number): void {
    this.pageIndex.set(index);
  }

  private load(): Booking[] {
    const existing = this.storage.get<Booking[]>(KEY);
    if (existing && existing.length) return existing;
    const seeded = buildSeedBookings(this.vehicleService.vehicles(), this.driverService.drivers());
    this.storage.set(KEY, seeded);
    return seeded;
  }

  private persist(): void {
    this.storage.set(KEY, this._bookings());
  }

  getById(id: string): Booking | undefined {
    return this._bookings().find((b) => b.id === id);
  }

  add(booking: Omit<Booking, 'id' | 'createdAt'>): Booking {
    const newBooking: Booking = {
      ...booking,
      id: String(100000 + Math.floor(Math.random() * 900000)),
      createdAt: new Date().toISOString(),
    };
    this._bookings.update((list) => [newBooking, ...list]);
    this.persist();
    return newBooking;
  }

  update(id: string, changes: Partial<Booking>): void {
    this._bookings.update((list) => list.map((b) => (b.id === id ? { ...b, ...changes } : b)));
    this.persist();
  }

  cancel(id: string): void {
    this.update(id, { status: 'Cancelled' });
  }

  markNoShow(id: string): void {
    this.update(id, { status: 'No Show' });
  }

  signInRider(id: string): void {
    const booking = this.getById(id);
    const actual = booking?.requestedPickupTime ?? null;
    this.update(id, { status: 'On Going', actualPickupTime: actual });
  }
}
