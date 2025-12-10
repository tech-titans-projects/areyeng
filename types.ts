
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  username: string;
  email: string;
  password?: string;
  role: UserRole;
  frequentRoutes?: string[];
  readNotificationIds?: string[];
}

export interface Bus {
  id: string;
  routeId: string;
  routeName: string;
  latitude: number;
  longitude: number;
  status: 'On Time' | 'Delayed' | 'Stopped';
  occupancy: number; // Percentage
  nextStop: string;
}

export interface ScheduleItem {
  id: string;
  routeId: string;
  stopName: string;
  arrivalTime: string;
  departureTime: string;
}

export interface Booking {
  id: string;
  userId: string;
  routeId: string;
  routeName: string;
  stopName: string;
  time: string;
  createdAt: string;
}

export enum Sentiment {
  POSITIVE = 'Positive',
  NEGATIVE = 'Negative',
  NEUTRAL = 'Neutral'
}

export interface Review {
  id: string;
  userId: string;
  username: string;
  text: string;
  sentiment: Sentiment;
  sentimentScore: number;
  createdAt: string;
  adminReply?: string;
  replyCreatedAt?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isAudio?: boolean;
}

export type NotificationType = 'Delay' | 'Schedule Change' | 'General';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  createdAt: string;
  author: string;
}
