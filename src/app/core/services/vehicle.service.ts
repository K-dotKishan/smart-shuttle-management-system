import { Injectable, computed, inject, signal } from '@angular/core';
import { Vehicle } from '../models';
import { StorageService } from './storage.service';
import { buildSeedVehicles } from '../data/seed-data';

const KEY = 'vehicles';

@Injectable({ providedIn: 'root' })
export class VehicleService {
  private storage = inject(StorageService);

  private readonly _vehicles = signal<Vehicle[]>(this.load());
  readonly vehicles = this._vehicles.asReadonly();

  readonly availableVehicles = computed(() =>
    this._vehicles().filter((v) => v.status === 'Available')
  );

  private load(): Vehicle[] {
    const existing = this.storage.get<Vehicle[]>(KEY);
    if (existing && existing.length) return existing;
    const seeded = buildSeedVehicles();
    this.storage.set(KEY, seeded);
    return seeded;
  }

  private persist(): void {
    this.storage.set(KEY, this._vehicles());
  }

  getById(id: string | null): Vehicle | undefined {
    if (!id) return undefined;
    return this._vehicles().find((v) => v.id === id);
  }

  add(vehicle: Omit<Vehicle, 'id'>): Vehicle {
    const newVehicle: Vehicle = { ...vehicle, id: `VEH-${Date.now()}` };
    this._vehicles.update((list) => [newVehicle, ...list]);
    this.persist();
    return newVehicle;
  }

  update(id: string, changes: Partial<Vehicle>): void {
    this._vehicles.update((list) =>
      list.map((v) => (v.id === id ? { ...v, ...changes } : v))
    );
    this.persist();
  }

  remove(id: string): void {
    this._vehicles.update((list) => list.filter((v) => v.id !== id));
    this.persist();
  }

  isDuplicateNumber(vehicleNumber: string, excludeId?: string): boolean {
    return this._vehicles().some(
      (v) => v.vehicleNumber.toLowerCase() === vehicleNumber.toLowerCase() && v.id !== excludeId
    );
  }
}
