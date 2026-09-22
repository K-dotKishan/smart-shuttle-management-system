import { Injectable } from '@angular/core';

/**
 * Small abstraction around window.localStorage so the rest of the app
 * never talks to the browser API directly. Keeps a consistent key prefix
 * and fails safely (e.g. private browsing, quota exceeded, SSR) instead
 * of throwing across the app.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly prefix = 'scsm:'; // Smart Campus Shuttle Management

  private hasStorage(): boolean {
    try {
      return typeof window !== 'undefined' && !!window.localStorage;
    } catch {
      return false;
    }
  }

  get<T>(key: string): T | null {
    if (!this.hasStorage()) return null;
    try {
      const raw = window.localStorage.getItem(this.prefix + key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (err) {
      console.warn(`StorageService: failed to read "${key}"`, err);
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    if (!this.hasStorage()) return;
    try {
      window.localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch (err) {
      console.warn(`StorageService: failed to write "${key}"`, err);
    }
  }

  remove(key: string): void {
    if (!this.hasStorage()) return;
    try {
      window.localStorage.removeItem(this.prefix + key);
    } catch {
      /* noop */
    }
  }

  clearAll(): void {
    if (!this.hasStorage()) return;
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith(this.prefix))
      .forEach((k) => window.localStorage.removeItem(k));
  }
}
