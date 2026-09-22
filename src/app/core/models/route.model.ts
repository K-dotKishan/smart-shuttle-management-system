export interface ShuttleRoute {
  id: string;
  name: string;
  description: string;
  pickupPoint: string;
  stops: string[];
  dropoffPoint: string;
  estimatedDurationMinutes: number;
  active: boolean;
}
