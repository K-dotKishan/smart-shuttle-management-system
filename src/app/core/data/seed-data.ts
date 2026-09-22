import {
  Driver,
  DriverScheduleEvent,
  Booking,
  Vehicle,
  ShuttleRoute,
  Trip,
} from '../models';
import { todayIso } from '../services/time.util';

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const DRIVER_NAMES = [
  'Samuel Jones',
  'Bob Jones',
  'Jonathan Spikes',
  'Daniel Smith',
  'Michael Brown',
  'Steve Smith',
  'Laura Chen',
  'Amara Okafor',
  'Priya Nair',
  'Carlos Mendes',
];

export function buildSeedDrivers(): Driver[] {
  return DRIVER_NAMES.map((name, i) => ({
    id: `DRV-${String(i + 1).padStart(3, '0')}`,
    name,
    phone: `+1-323-${400 + i}-32${i}${i}`,
    email: `${name.toLowerCase().replace(' ', '.')}@campus.edu`,
    photoInitials: initials(name),
    online: i % 3 !== 2,
    dutyStatus: i % 4 === 0 ? 'on-break' : i % 3 === 2 ? 'off-duty' : 'on-duty',
    currentVehicleId: i < 8 ? `VEH-${String(i + 1).padStart(3, '0')}` : null,
    rating: Number((4 + (i % 10) / 10).toFixed(1)),
    licenseNumber: `LIC-${9000 + i}`,
    active: true,
    joinedDate: `2022-0${(i % 9) + 1}-1${i % 9}`,
  }));
}

const EVENT_LIBRARY: { type: DriverScheduleEvent['type']; label: string }[] = [
  { type: 'duty', label: 'Duty Start' },
  { type: 'pickup', label: 'Pickup' },
  { type: 'drop', label: 'Drop' },
  { type: 'break', label: 'Break' },
  { type: 'vehicle-change', label: 'Vehicle Change' },
  { type: 'empty-leg', label: 'Empty Leg' },
];

export function buildSeedScheduleEvents(drivers: Driver[], date = todayIso()): DriverScheduleEvent[] {
  const events: DriverScheduleEvent[] = [];
  let seq = 1;

  drivers.forEach((driver, di) => {
    if (driver.dutyStatus === 'off-duty' && di % 2 === 0) return; // some drivers have no events today

    const dutyStart = 6 * 60 + (di % 3) * 30; // stagger starts
    const dutyEnd = 17 * 60 + (di % 2) * 60;

    events.push({
      id: `EVT-${seq++}`,
      driverId: driver.id,
      date,
      type: 'duty',
      startMinutes: dutyStart,
      endMinutes: dutyStart + 15,
      label: 'Duty Start',
    });

    let cursor = dutyStart + 30;
    const stops = 3 + (di % 4);
    for (let s = 0; s < stops && cursor < dutyEnd - 90; s++) {
      const pickDur = 15 + (s % 3) * 10;
      events.push({
        id: `EVT-${seq++}`,
        driverId: driver.id,
        date,
        type: s % 2 === 0 ? 'pickup' : 'drop',
        startMinutes: cursor,
        endMinutes: cursor + pickDur,
        label: s % 2 === 0 ? 'Pickup' : 'Drop',
        bookingId: `${123123 + ((di + s) % 5) * 1000}`,
      });
      cursor += pickDur + 20;
    }

    if (di % 4 === 0) {
      events.push({
        id: `EVT-${seq++}`,
        driverId: driver.id,
        date,
        type: 'break',
        startMinutes: 12 * 60,
        endMinutes: 12 * 60 + 30,
        label: 'Break',
        notes: 'Lunch break',
      });
    }

    if (di % 5 === 0) {
      events.push({
        id: `EVT-${seq++}`,
        driverId: driver.id,
        date,
        type: 'vehicle-change',
        startMinutes: 14 * 60,
        endMinutes: 14 * 60 + 10,
        label: 'Vehicle Change',
      });
    }

    if (driver.dutyStatus !== 'off-duty') {
      events.push({
        id: `EVT-${seq++}`,
        driverId: driver.id,
        date,
        type: 'duty',
        startMinutes: dutyEnd,
        endMinutes: dutyEnd + 10,
        label: 'Duty End',
      });
    }
  });

  return events;
}

const VEHICLE_TYPES = ['White Bus', 'Mini Van', 'Electric Shuttle', 'Sedan'];

export function buildSeedVehicles(): Vehicle[] {
  const statuses: Vehicle['status'][] = ['Available', 'In Use', 'Maintenance', 'Inactive'];
  return Array.from({ length: 15 }).map((_, i) => ({
    id: `VEH-${String(i + 1).padStart(3, '0')}`,
    vehicleNumber: `NB-${String(i + 1).padStart(3, '0')}-RF`,
    registrationNumber: `UA${3200 + i}`,
    vehicleType: VEHICLE_TYPES[i % VEHICLE_TYPES.length],
    capacity: [12, 8, 16, 4][i % 4],
    status: i < 8 ? 'Available' : statuses[i % statuses.length],
    assignedDriverId: i < 8 ? `DRV-${String(i + 1).padStart(3, '0')}` : null,
  }));
}

export function buildSeedRoutes(): ShuttleRoute[] {
  const routeDefs: Array<{ name: string; stops: string[]; mins: number }> = [
    { name: 'Campus Route A', stops: ['Library', 'Parking', 'Data Centre'], mins: 18 },
    { name: 'Campus Route B', stops: ['Hostel Block 1', 'Cafeteria', 'Main Gate'], mins: 12 },
    { name: 'Campus Route C', stops: ['Library', 'Hostel Block 2', 'Sports Complex'], mins: 20 },
    { name: 'Campus Route D', stops: ['Data Centre', 'Admin Block', 'Parking'], mins: 15 },
    { name: 'Campus Route E', stops: ['Main Gate', 'Cafeteria', 'Library'], mins: 10 },
    { name: 'Campus Route F', stops: ['Sports Complex', 'Hostel Block 1', 'Main Gate'], mins: 22 },
    { name: 'Campus Route G', stops: ['Parking', 'Admin Block', 'Data Centre'], mins: 14 },
    { name: 'Campus Route H', stops: ['Hostel Block 2', 'Library', 'Cafeteria'], mins: 16 },
  ];
  return routeDefs.map((r, i) => ({
    id: `RT-${String(i + 1).padStart(3, '0')}`,
    name: r.name,
    description: `Shuttle loop connecting ${r.stops.join(', ')}.`,
    pickupPoint: r.stops[0],
    stops: r.stops.slice(1, -1),
    dropoffPoint: r.stops[r.stops.length - 1],
    estimatedDurationMinutes: r.mins,
    active: i !== 6,
  }));
}

const EMPLOYEES = [
  'Thompson',
  'Daniel Radcliff',
  'W.J. Smith',
  'Tina Shah',
  'Emma Wilson',
  'Raj Patel',
  'Grace Lee',
  'Oliver Kim',
  'Sofia Garcia',
  'Noah Bennett',
];

const LOCATIONS = ['Library', 'Data Centre', 'Parking', 'Hostel Block 1', 'Cafeteria', 'Main Gate'];
const STATUSES: Booking['status'][] = [
  'Accepted',
  'Waiting',
  'No Show',
  'Declined',
  'Completed',
  'Requested',
  'On Going',
  'Cancelled',
  'Dropped',
];

export function buildSeedBookings(vehicles: Vehicle[], drivers: Driver[], date = todayIso()): Booking[] {
  const bookings: Booking[] = [];
  for (let i = 0; i < 20; i++) {
    const status = STATUSES[i % STATUSES.length];
    const from = LOCATIONS[i % LOCATIONS.length];
    let to = LOCATIONS[(i + 2) % LOCATIONS.length];
    if (to === from) to = LOCATIONS[(i + 3) % LOCATIONS.length];
    const hasVehicle = status !== 'Declined' && status !== 'Requested';
    const vehicle = hasVehicle ? vehicles[i % vehicles.length] : null;
    const driver = hasVehicle ? drivers[i % drivers.length] : null;
    const reqHour = 11 + (i % 6);
    const reqMin = (i * 7) % 60;
    const requested = `${String(reqHour).padStart(2, '0')}:${String(reqMin).padStart(2, '0')}`;
    const completed = status === 'Completed' || status === 'Dropped';
    const onGoing = status === 'On Going';

    bookings.push({
      id: `${123123 + i * 1000}`,
      employeeName: EMPLOYEES[i % EMPLOYEES.length],
      employeeId: `EMP-${1000 + i}`,
      status,
      fromLocation: from,
      toLocation: to,
      vehicleId: vehicle?.id ?? null,
      driverId: driver?.id ?? null,
      requestedPickupTime: requested,
      actualPickupTime: completed || onGoing ? addMinutes(requested, 7) : null,
      plannedDropTime: hasVehicle ? addMinutes(requested, 20) : null,
      actualDropTime: completed ? addMinutes(requested, 27) : null,
      date,
      notes: '',
      routeId: hasVehicle ? `RT-${String((i % 8) + 1).padStart(3, '0')}` : null,
      createdAt: new Date().toISOString(),
    });
  }
  return bookings;
}

function addMinutes(hhmm: string, add: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const total = h * 60 + m + add;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

export function buildSeedTrips(
  routes: ShuttleRoute[],
  drivers: Driver[],
  vehicles: Vehicle[]
): Trip[] {
  const trips: Trip[] = [];
  const tripStatuses: Trip['status'][] = ['Completed', 'Completed', 'Completed', 'Cancelled', 'No Show'];
  for (let i = 0; i < 24; i++) {
    const daysAgo = i % 10;
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const route = routes[i % routes.length];
    const driver = drivers[i % drivers.length];
    const vehicle = vehicles[i % vehicles.length];
    const pickupHour = 7 + (i % 12);
    const pickup = `${String(pickupHour).padStart(2, '0')}:${String((i * 5) % 60).padStart(2, '0')}`;
    trips.push({
      id: `TRP-${String(i + 1).padStart(4, '0')}`,
      date: d.toISOString().slice(0, 10),
      employeeName: EMPLOYEES[i % EMPLOYEES.length],
      routeId: route.id,
      routeName: route.name,
      driverId: driver.id,
      driverName: driver.name,
      vehicleId: vehicle.id,
      vehicleNumber: vehicle.vehicleNumber,
      pickupTime: pickup,
      dropTime: addMinutes(pickup, route.estimatedDurationMinutes),
      status: tripStatuses[i % tripStatuses.length],
    });
  }
  return trips;
}
