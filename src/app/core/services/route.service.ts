import { Injectable, inject, signal } from '@angular/core';
import { ShuttleRoute } from '../models';
import { StorageService } from './storage.service';
import { buildSeedRoutes } from '../data/seed-data';

const KEY = 'routes';

@Injectable({ providedIn: 'root' })
export class RouteService {
  private storage = inject(StorageService);

  private readonly _routes = signal<ShuttleRoute[]>(this.load());
  readonly routes = this._routes.asReadonly();

  private load(): ShuttleRoute[] {
    const existing = this.storage.get<ShuttleRoute[]>(KEY);
    if (existing && existing.length) return existing;
    const seeded = buildSeedRoutes();
    this.storage.set(KEY, seeded);
    return seeded;
  }

  private persist(): void {
    this.storage.set(KEY, this._routes());
  }

  getById(id: string | null): ShuttleRoute | undefined {
    if (!id) return undefined;
    return this._routes().find((r) => r.id === id);
  }

  isDuplicateName(name: string, excludeId?: string): boolean {
    return this._routes().some(
      (r) => r.name.trim().toLowerCase() === name.trim().toLowerCase() && r.id !== excludeId
    );
  }

  add(route: Omit<ShuttleRoute, 'id'>): ShuttleRoute {
    const newRoute: ShuttleRoute = { ...route, id: `RT-${Date.now()}` };
    this._routes.update((list) => [newRoute, ...list]);
    this.persist();
    return newRoute;
  }

  update(id: string, changes: Partial<ShuttleRoute>): void {
    this._routes.update((list) => list.map((r) => (r.id === id ? { ...r, ...changes } : r)));
    this.persist();
  }

  remove(id: string): void {
    this._routes.update((list) => list.filter((r) => r.id !== id));
    this.persist();
  }
}
