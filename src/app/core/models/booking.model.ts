export type BookingStatus =
  | 'Requested'
  | 'Accepted'
  | 'Waiting'
  | 'On Going'
  | 'Completed'
  | 'No Show'
  | 'Declined'
  | 'Cancelled'
  | 'Dropped';

export interface Booking {
  id: string;
  employeeName: string;
  employeeId: string;
  status: BookingStatus;
  fromLocation: string;
  toLocation: string;
  vehicleId: string | null;
  driverId: string | null;
  requestedPickupTime: string; // HH:mm
  actualPickupTime: string | null; // HH:mm
  plannedDropTime: string | null; // HH:mm
  actualDropTime: string | null; // HH:mm
  date: string; // ISO date
  notes: string;
  routeId: string | null;
  createdAt: string; // ISO datetime
}
