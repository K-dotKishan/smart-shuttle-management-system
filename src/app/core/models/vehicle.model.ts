export type VehicleStatus = 'Available' | 'In Use' | 'Maintenance' | 'Inactive';

export interface Vehicle {
  id: string;
  vehicleNumber: string;
  registrationNumber: string;
  vehicleType: string;
  capacity: number;
  status: VehicleStatus;
  assignedDriverId: string | null;
}
