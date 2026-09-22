export type TripStatus = 'Completed' | 'Cancelled' | 'No Show';

export interface Trip {
  id: string;
  date: string; // ISO date
  employeeName: string;
  routeId: string | null;
  routeName: string;
  driverId: string | null;
  driverName: string;
  vehicleId: string | null;
  vehicleNumber: string;
  pickupTime: string; // HH:mm
  dropTime: string; // HH:mm
  status: TripStatus;
}
