export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Room {
  id: string;
  name: string;
  description?: string;
  clientId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Wall {
  id: string;
  name: string;
  widthFeet: number;  // Wall width in feet
  heightFeet: number; // Wall height in feet
  roomId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Fixture {
  id: string;
  type: string;         // e.g., "sink", "mirror", "light", "outlet", "window"
  name: string;
  widthInches: number;  // Fixture width in inches
  heightInches: number; // Fixture height in inches
  positionX: number;    // X position from left in inches
  positionY: number;    // Y position from bottom in inches
  productUrl?: string;  // URL to product/spec
  notes?: string;
  wallId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Extended types with relations
export interface WallWithFixtures extends Wall {
  fixtures: Fixture[];
}

export interface RoomWithWalls extends Room {
  walls: WallWithFixtures[];
}

export interface ClientWithRooms extends Client {
  rooms: RoomWithWalls[];
}

// Scale constant: 0.5 inches = 1 foot (as specified)
export const SCALE_INCHES_PER_FOOT = 0.5;

// Helper function to convert feet to drawing inches
export function feetToDrawingInches(feet: number): number {
  return feet * SCALE_INCHES_PER_FOOT;
}

// Helper function to convert fixture inches to drawing inches
export function fixtureInchesToDrawingInches(inches: number): number {
  return inches * SCALE_INCHES_PER_FOOT / 12; // Convert to feet first, then to drawing scale
}
