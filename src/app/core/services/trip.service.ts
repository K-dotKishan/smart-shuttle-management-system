import { Injectable, computed, inject, signal } from '@angular/core';
import { Trip } from '../models';
import { StorageService } from './storage.service';
import { buildSeedTrips } from '../data/seed-data';
import { RouteService } from './route.service';
import { DriverService } from './driver.service';
import { VehicleService } from './vehicle.service';

const KEY = 'trips';

export interface TripFilters {
  search: string;
  date: string | 'All';
  driverId: string | 'All';
  routeId: string | 'All';
  status: Trip['status'] | 'All';
}

@Injectable({ providedIn: 'root' })
export class TripService {
  private storage = inject(StorageService);
  private routeService = inject(RouteService);
  private driverService = inject(DriverService);
  private vehicleService = inject(VehicleService);

  private readonly _trips = signal<Trip[]>(this.load());
  readonly trips = this._trips.asReadonly();

  readonly searchTerm = signal('');
  readonly dateFilter = signal<string | 'All'>('All');
  readonly driverFilter = signal<string | 'All'>('All');
  readonly routeFilter = signal<string | 'All'>('All');
  readonly statusFilter = signal<Trip['status'] | 'All'>('All');

  readonly filteredTrips = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    return this._trips().filter((t) => {
      if (term && !t.employeeName.toLowerCase().includes(term) && !t.id.toLowerCase().includes(term)) {
        return false;
      }
      if (this.dateFilter() !== 'All' && t.date !== this.dateFilter()) return false;
      if (this.driverFilter() !== 'All' && t.driverId !== this.driverFilter()) return false;
      if (this.routeFilter() !== 'All' && t.routeId !== this.routeFilter()) return false;
      if (this.statusFilter() !== 'All' && t.status !== this.statusFilter()) return false;
      return true;
    });
  });

  private load(): Trip[] {
    const existing = this.storage.get<Trip[]>(KEY);
    if (existing && existing.length) return existing;
    const seeded = buildSeedTrips(
      this.routeService.routes(),
      this.driverService.drivers(),
      this.vehicleService.vehicles()
    );
    this.storage.set(KEY, seeded);
    return seeded;
  }
}
