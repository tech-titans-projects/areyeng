
import { Bus, ScheduleItem } from "../types";

// Coordinates for Pretoria/Tshwane area (Areyeng operates here)
const CENTER_LAT = -25.7479;
const CENTER_LNG = 28.2293;

export const ROUTES_INFO = [
  { id: 'T1', label: 'CBD to Hatfield' },
  { id: 'T2', label: 'Wonderboom Junction to CBD' },
  { id: 'C1', label: 'Menlyn Maine to CBD' }
];

export const INITIAL_BUSES: Bus[] = [
  {
    id: 'B-101',
    routeId: 'T1',
    routeName: 'T1 (CBD to Hatfield)',
    latitude: -25.7461,
    longitude: 28.2315,
    status: 'On Time',
    occupancy: 45,
    nextStop: 'Hatfield Station'
  },
  {
    id: 'B-102',
    routeId: 'T2',
    routeName: 'T2 (Wonderboom)',
    latitude: -25.7313,
    longitude: 28.1950,
    status: 'Delayed',
    occupancy: 80,
    nextStop: 'Bloed Street'
  },
  {
    id: 'B-103',
    routeId: 'C1',
    routeName: 'C1 (Menlyn)',
    latitude: -25.7830,
    longitude: 28.2750,
    status: 'On Time',
    occupancy: 20,
    nextStop: 'Menlyn Maine'
  }
];

export const SCHEDULES: ScheduleItem[] = [
  { id: 'S1', routeId: 'T1', stopName: 'Hatfield Station', arrivalTime: '08:00', departureTime: '08:05' },
  { id: 'S2', routeId: 'T1', stopName: 'Loftus Versfeld', arrivalTime: '08:15', departureTime: '08:18' },
  { id: 'S3', routeId: 'T1', stopName: 'CBD - General Hospital', arrivalTime: '08:30', departureTime: '08:35' },
  { id: 'S4', routeId: 'T2', stopName: 'Wonderboom Junction', arrivalTime: '08:10', departureTime: '08:15' },
  { id: 'S5', routeId: 'T2', stopName: 'Moses Mabhida', arrivalTime: '08:40', departureTime: '08:45' },
  { id: 'S6', routeId: 'C1', stopName: 'Menlyn Maine', arrivalTime: '07:30', departureTime: '07:35' },
  { id: 'S7', routeId: 'C1', stopName: 'Brooklyn', arrivalTime: '07:50', departureTime: '07:55' },
];

export const updateBusPosition = (bus: Bus): Bus => {
  // Simple random walk simulation for demo purposes
  const latMove = (Math.random() - 0.5) * 0.002;
  const lngMove = (Math.random() - 0.5) * 0.002;
  
  return {
    ...bus,
    latitude: bus.latitude + latMove,
    longitude: bus.longitude + lngMove
  };
};
