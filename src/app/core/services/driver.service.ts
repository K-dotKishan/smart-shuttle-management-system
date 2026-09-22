import { Injectable, computed, inject, signal } from '@angular/core';
import { Driver, DriverScheduleEvent } from '../models';
import { StorageService } from './storage.service';
import { buildSeedDrivers, buildSeedScheduleEvents } from '../data/seed-data';
import { rangesOverlap, todayIso } from './time.util';

const DRIVERS_KEY = 'drivers';
const EVENTS_KEY = 'driverScheduleEvents';

@Injectable({ providedIn: 'root' })
export class DriverService {
  private storage = inject(StorageService);

  private readonly _drivers = signal<Driver[]>(this.loadDrivers());
  private readonly _events = signal<DriverScheduleEvent[]>(this.loadEvents());

  readonly drivers = this._drivers.asReadonly();
  readonly events = this._events.asReadonly();

  readonly activeDrivers = computed(() => this._drivers().filter((d) => d.active));
  readonly onlineCount = computed(
    () => this._drivers().filter((d) => d.active && d.online).length
  );
  readonly availableNowCount = computed(
    () => this._drivers().filter((d) => d.active && d.online && d.dutyStatus !== 'off-duty').length
  );

  private loadDrivers(): Driver[] {
    const existing = this.storage.get<Driver[]>(DRIVERS_KEY);
    if (existing && existing.length) return existing;
    const seeded = buildSeedDrivers();
    this.storage.set(DRIVERS_KEY, seeded);
    return seeded;
  }

  private loadEvents(): DriverScheduleEvent[] {
    const existing = this.storage.get<DriverScheduleEvent[]>(EVENTS_KEY);
    if (existing && existing.length) return existing;
    const seeded = buildSeedScheduleEvents(this.loadDrivers());
    this.storage.set(EVENTS_KEY, seeded);
    return seeded;
  }

  private persistDrivers(): void {
    this.storage.set(DRIVERS_KEY, this._drivers());
  }

  private persistEvents(): void {
    this.storage.set(EVENTS_KEY, this._events());
  }

  getById(id: string | null): Driver | undefined {
    if (!id) return undefined;
    return this._drivers().find((d) => d.id === id);
  }

  eventsForDriver(driverId: string, date: string): DriverScheduleEvent[] {
    return this._events()
      .filter((e) => e.driverId === driverId && e.date === date)
      .sort((a, b) => a.startMinutes - b.startMinutes);
  }

  /** Drivers free for the given time window on the given date (used by booking assignment). */
  availableDriversForWindow(date: string, startMinutes: number, endMinutes: number): Driver[] {
    return this.activeDrivers().filter((driver) => {
      const busy = this._events().some(
        (e) =>
          e.driverId === driver.id &&
          e.date === date &&
          e.type !== 'duty' &&
          rangesOverlap(startMinutes, endMinutes, e.startMinutes, e.endMinutes)
      );
      return !busy;
    });
  }

  add(driver: Omit<Driver, 'id' | 'photoInitials'>): Driver {
    const initials = driver.name
      .split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
    const newDriver: Driver = { ...driver, id: `DRV-${Date.now()}`, photoInitials: initials };
    this._drivers.update((list) => [newDriver, ...list]);
    this.persistDrivers();
    return newDriver;
  }

  update(id: string, changes: Partial<Driver>): void {
    this._drivers.update((list) => list.map((d) => (d.id === id ? { ...d, ...changes } : d)));
    this.persistDrivers();
  }

  remove(id: string): void {
    this._drivers.update((list) => list.filter((d) => d.id !== id));
    this.persistDrivers();
  }

  deactivate(id: string): void {
    this.update(id, { active: false, online: false, dutyStatus: 'off-duty' });
  }

  addEvent(event: Omit<DriverScheduleEvent, 'id'>): DriverScheduleEvent {
    const newEvent: DriverScheduleEvent = { ...event, id: `EVT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` };
    this._events.update((list) => [...list, newEvent]);
    this.persistEvents();
    return newEvent;
  }

  updateEvent(id: string, changes: Partial<DriverScheduleEvent>): void {
    this._events.update((list) => list.map((e) => (e.id === id ? { ...e, ...changes } : e)));
    this.persistEvents();
  }

  removeEvent(id: string): void {
    this._events.update((list) => list.filter((e) => e.id !== id));
    this.persistEvents();
  }

  startDuty(driverId: string, date: string, startMinutes: number, endMinutes: number, notes: string): void {
    this.addEvent({
      driverId,
      date,
      type: 'duty',
      startMinutes,
      endMinutes: Math.min(startMinutes + 15, endMinutes),
      label: 'Duty Start',
      notes,
    });
    this.update(driverId, { dutyStatus: 'on-duty', online: true });
  }

  endDuty(driverId: string, date: string, endMinutes: number): void {
    this.addEvent({
      driverId,
      date,
      type: 'duty',
      startMinutes: Math.max(endMinutes - 10, 0),
      endMinutes,
      label: 'Duty End',
    });
    this.update(driverId, { dutyStatus: 'off-duty' });
  }

  addBreak(driverId: string, date: string, startMinutes: number, endMinutes: number, reason: string): void {
    this.addEvent({
      driverId,
      date,
      type: 'break',
      startMinutes,
      endMinutes,
      label: 'Break',
      notes: reason,
    });
    this.update(driverId, { dutyStatus: 'on-break' });
  }
}
