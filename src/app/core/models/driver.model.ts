export type DriverDutyStatus = 'on-duty' | 'off-duty' | 'on-break';

export interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string;
  photoInitials: string;
  online: boolean;
  dutyStatus: DriverDutyStatus;
  currentVehicleId: string | null;
  rating: number;
  licenseNumber: string;
  active: boolean;
  joinedDate: string; // ISO date
}

export type ScheduleEventType =
  | 'duty'
  | 'break'
  | 'pickup'
  | 'drop'
  | 'vehicle-change'
  | 'empty-leg';

export interface DriverScheduleEvent {
  id: string;
  driverId: string;
  date: string; // ISO date (yyyy-MM-dd)
  type: ScheduleEventType;
  startMinutes: number; // minutes from 00:00
  endMinutes: number; // minutes from 00:00
  label: string;
  bookingId?: string;
  notes?: string;
}
