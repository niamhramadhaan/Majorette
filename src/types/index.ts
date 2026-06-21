export type MediaType =
  | 'Film'
  | 'MusicVideo'
  | 'Podcast'
  | 'Advertisement'
  | 'Bumper'
  | 'Trailer'
  | 'Other';

export type MediaStatus =
  | 'Synced'
  | 'Not Synced'
  | 'Processing'
  | 'Expired'
  | 'Expiring Soon';

export interface MediaItem {
  id: number | string;
  title: string;
  type: MediaType;
  duration: number;
  status: MediaStatus;
  posterPath: string | null;
  synopsis?: string;
  tags?: string[];
  publishDate?: string;
  expiryDate?: string;
  publisher?: string;
  targetLocations?: number;
  genre?: string;
  ageRating?: string;
  audioType?: string;
  director?: string;
  volume?: number;
  aesKey?: string;
}

export type ScreenStatus = 'Playing' | 'Idle' | 'Online' | 'Offline' | 'Error';

export interface Screen {
  id: string;
  name: string;
  locationId: string;
  locationName: string;
  status: ScreenStatus;
  currentItem?: string;
  lastHeartbeat: Date;
}

export interface Location {
  id: string;
  name: string;
  code: string;
  screens: number;
  status: 'Active' | 'Inactive';
  manager?: string;
  timezone: string;
  lastActive?: string;
  lat: number;
  lng: number;
}

export type SetlistStatus = 'Active' | 'Draft' | 'Archived';

export interface Setlist {
  id: number | string;
  name: string;
  date: string;
  items: number;
  duration: number;
  status: SetlistStatus;
  locations: number;
  updated: string;
  log?: string;
}

export interface SetlistItem {
  id: string;
  mediaItemId: string | number;
  title: string;
  type: MediaType;
  duration: number;
  order: number;
}

// Phase 2: Local content types

export type ContentType = 'video' | 'audio' | 'image';

export interface LocalContent {
  id: string;
  title: string;
  type: ContentType;
  filePath: string;
  fileName: string;
  mimeType?: string;
  duration: number;
  thumbnailPath?: string;
  createdAt: string;
}

export interface ScheduleItem {
  contentId: string;
  order: number;
  duration?: number;
  audioOverlay?: boolean;
}

export type ScheduleMode = 'loop' | 'once';
export type ScheduleStatus = 'unplayed' | 'playing' | 'done';

export interface Schedule {
  id: string;
  name: string;
  items: ScheduleItem[];
  mode: ScheduleMode;
  startTime: string;
  locationId: string;
  status?: ScheduleStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Venue {
  id: string;
  name: string;
  screens: number;
  createdAt: string;
}

export interface AppSettings {
  setupComplete: boolean;
  venueName: string;
  timezone: string;
  contentRoot: string;
}

export interface ActivityLog {
  id: string;
  message: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning';
}
