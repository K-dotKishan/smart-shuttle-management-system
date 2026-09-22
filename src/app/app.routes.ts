import { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell/shell.component';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
        title: 'Dashboard · Campus Shuttle',
      },
      {
        path: 'operations',
        loadComponent: () =>
          import('./features/operations/operations.component').then(
            (m) => m.OperationsComponent
          ),
        title: 'Operations · Campus Shuttle',
      },
      {
        path: 'drivers',
        loadComponent: () =>
          import('./features/drivers/driver-management.component').then(
            (m) => m.DriverManagementComponent
          ),
        title: 'Drivers · Campus Shuttle',
      },
      {
        path: 'bookings',
        loadComponent: () =>
          import('./features/bookings/booking-management.component').then(
            (m) => m.BookingManagementComponent
          ),
        title: 'Employee Journeys · Campus Shuttle',
      },
      {
        path: 'routes',
        loadComponent: () =>
          import('./features/routes/route-management.component').then(
            (m) => m.RouteManagementComponent
          ),
        title: 'Routes · Campus Shuttle',
      },
      {
        path: 'vehicles',
        loadComponent: () =>
          import('./features/vehicles/vehicle-management.component').then(
            (m) => m.VehicleManagementComponent
          ),
        title: 'Vehicles · Campus Shuttle',
      },
      {
        path: 'trips',
        loadComponent: () =>
          import('./features/trips/trip-history.component').then((m) => m.TripHistoryComponent),
        title: 'Trip History · Campus Shuttle',
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.component').then((m) => m.SettingsComponent),
        title: 'Settings · Campus Shuttle',
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
