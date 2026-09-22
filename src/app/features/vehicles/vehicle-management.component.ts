import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SearchBarComponent } from '../../shared/components/search-bar/search-bar.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { DriverService, NotificationService, VehicleService } from '../../core/services';
import { Vehicle, VehicleStatus } from '../../core/models';
import { VehicleFormDialogComponent } from './vehicle-form-dialog.component';

const STATUS_OPTIONS: VehicleStatus[] = ['Available', 'In Use', 'Maintenance', 'Inactive'];

@Component({
  selector: 'app-vehicle-management',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent, SearchBarComponent, StatusBadgeComponent, EmptyStateComponent, MatIconModule],
  template: `
    <app-page-header title="Vehicle Management" subtitle="Fleet roster, capacity and assignment status">
      <div actions>
        <button class="btn btn-primary" type="button" (click)="openAdd()">
          <mat-icon>add</mat-icon> Add Vehicle
        </button>
      </div>
    </app-page-header>

    <div class="card">
      <div class="toolbar">
        <app-search-bar placeholder="Search vehicle number or type…" (search)="searchTerm.set($event)"></app-search-bar>
        <select class="select" [value]="statusFilter()" (change)="onStatusFilter($event)" aria-label="Filter by status">
          <option value="All">All statuses</option>
          @for (s of statusOptions; track s) { <option [value]="s">{{ s }}</option> }
        </select>
      </div>

      @if (filteredVehicles().length === 0) {
        <app-empty-state icon="directions_bus" title="No vehicles found" description="Try a different search or filter."></app-empty-state>
      } @else {
        <div class="scroll-x">
          <table class="data-table">
            <thead>
              <tr>
                <th>Vehicle Number</th>
                <th>Registration</th>
                <th>Type</th>
                <th>Capacity</th>
                <th>Status</th>
                <th>Assigned Driver</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (v of filteredVehicles(); track v.id) {
                <tr>
                  <td><strong>{{ v.vehicleNumber }}</strong></td>
                  <td>{{ v.registrationNumber }}</td>
                  <td>{{ v.vehicleType }}</td>
                  <td>{{ v.capacity }} seats</td>
                  <td><app-status-badge [status]="v.status"></app-status-badge></td>
                  <td>{{ driverName(v.assignedDriverId) }}</td>
                  <td>
                    <div class="flex gap-2">
                      <button class="btn" type="button" (click)="openEdit(v)">Edit</button>
                      <button class="btn btn-danger" type="button" (click)="confirmDelete(v)">Delete</button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 16px; flex-wrap: wrap; }
      .select { border: 1px solid var(--color-border-strong); border-radius: var(--radius-md); padding: 7px 10px; font-size: 12.5px; background: var(--color-surface); color: var(--color-text); }
    `,
  ],
})
export class VehicleManagementComponent {
  private vehicleService = inject(VehicleService);
  private driverService = inject(DriverService);
  private dialog = inject(MatDialog);
  private notifications = inject(NotificationService);

  statusOptions = STATUS_OPTIONS;
  searchTerm = signal('');
  statusFilter = signal<VehicleStatus | 'All'>('All');

  filteredVehicles = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const status = this.statusFilter();
    return this.vehicleService.vehicles().filter((v) => {
      if (term && !v.vehicleNumber.toLowerCase().includes(term) && !v.vehicleType.toLowerCase().includes(term)) return false;
      if (status !== 'All' && v.status !== status) return false;
      return true;
    });
  });

  driverName(driverId: string | null): string {
    if (!driverId) return 'Unassigned';
    return this.driverService.getById(driverId)?.name ?? 'Unassigned';
  }

  onStatusFilter(e: Event): void {
    this.statusFilter.set((e.target as HTMLSelectElement).value as VehicleStatus | 'All');
  }

  openAdd(): void {
    const ref = this.dialog.open(VehicleFormDialogComponent, { data: {}, width: '460px' });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      if (this.vehicleService.isDuplicateNumber(result.vehicleNumber)) {
        this.notifications.error('A vehicle with this number already exists.');
        return;
      }
      this.vehicleService.add(result);
      this.notifications.success('Vehicle added.');
    });
  }

  openEdit(vehicle: Vehicle): void {
    const ref = this.dialog.open(VehicleFormDialogComponent, { data: { vehicle }, width: '460px' });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      if (this.vehicleService.isDuplicateNumber(result.vehicleNumber, vehicle.id)) {
        this.notifications.error('A vehicle with this number already exists.');
        return;
      }
      this.vehicleService.update(vehicle.id, result);
      this.notifications.success('Vehicle updated.');
    });
  }

  confirmDelete(vehicle: Vehicle): void {
    const data: ConfirmDialogData = {
      title: 'Delete vehicle?',
      message: `Vehicle ${vehicle.vehicleNumber} will be permanently removed from the fleet.`,
      confirmLabel: 'Delete',
      danger: true,
    };
    const ref = this.dialog.open(ConfirmDialogComponent, { data, width: '420px' });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.vehicleService.remove(vehicle.id);
      this.notifications.success('Vehicle deleted.');
    });
  }
}
