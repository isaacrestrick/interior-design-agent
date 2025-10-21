import { Client, Room, Wall, Fixture, WallWithFixtures } from '@/types';

// Simple in-memory database (replace with Prisma later)
class Database {
  private clients: Map<string, Client> = new Map();
  private rooms: Map<string, Room> = new Map();
  private walls: Map<string, Wall> = new Map();
  private fixtures: Map<string, Fixture> = new Map();

  // Client operations
  createClient(
    data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>,
    options: { id?: string } = {}
  ): Client {
    const client: Client = {
      ...data,
      id: options.id ?? crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.clients.set(client.id, client);
    return client;
  }

  getClient(id: string): Client | undefined {
    return this.clients.get(id);
  }

  getAllClients(): Client[] {
    return Array.from(this.clients.values());
  }

  // Room operations
  createRoom(
    data: Omit<Room, 'id' | 'createdAt' | 'updatedAt'>,
    options: { id?: string } = {}
  ): Room {
    const room: Room = {
      ...data,
      id: options.id ?? crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.rooms.set(room.id, room);
    return room;
  }

  getRoom(id: string): Room | undefined {
    return this.rooms.get(id);
  }

  getRoomsByClient(clientId: string): Room[] {
    return Array.from(this.rooms.values()).filter(r => r.clientId === clientId);
  }

  // Wall operations
  createWall(
    data: Omit<Wall, 'id' | 'createdAt' | 'updatedAt'>,
    options: { id?: string } = {}
  ): Wall {
    const wall: Wall = {
      ...data,
      id: options.id ?? crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.walls.set(wall.id, wall);
    return wall;
  }

  getWall(id: string): Wall | undefined {
    return this.walls.get(id);
  }

  getWallsByRoom(roomId: string): Wall[] {
    return Array.from(this.walls.values()).filter(w => w.roomId === roomId);
  }

  getWallWithFixtures(id: string): WallWithFixtures | undefined {
    const wall = this.walls.get(id);
    if (!wall) return undefined;

    const fixtures = this.getFixturesByWall(id);
    return { ...wall, fixtures };
  }

  // Fixture operations
  createFixture(
    data: Omit<Fixture, 'id' | 'createdAt' | 'updatedAt'>,
    options: { id?: string } = {}
  ): Fixture {
    const fixture: Fixture = {
      ...data,
      id: options.id ?? crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.fixtures.set(fixture.id, fixture);
    return fixture;
  }

  getFixture(id: string): Fixture | undefined {
    return this.fixtures.get(id);
  }

  getFixturesByWall(wallId: string): Fixture[] {
    return Array.from(this.fixtures.values()).filter(f => f.wallId === wallId);
  }

  updateFixture(id: string, data: Partial<Omit<Fixture, 'id' | 'createdAt' | 'updatedAt' | 'wallId'>>): Fixture | undefined {
    const fixture = this.fixtures.get(id);
    if (!fixture) return undefined;

    const updated = {
      ...fixture,
      ...data,
      updatedAt: new Date(),
    };
    this.fixtures.set(id, updated);
    return updated;
  }

  deleteFixture(id: string): boolean {
    return this.fixtures.delete(id);
  }
}

// Export singleton instance
export const db = new Database();

// Initialize with sample data
function initializeSampleData() {
  const SAMPLE_CLIENT_ID = "client-sample";
  const SAMPLE_ROOM_ID = "room-sample";
  const SAMPLE_WALL_ID = "wall-sample";
  const SAMPLE_FIXTURE_IDS = {
    sink: "fixture-sink",
    mirror: "fixture-mirror",
    light: "fixture-light",
    outlet: "fixture-outlet",
  } as const;

  const client = db.createClient(
    {
      name: "Sample Client",
      email: "client@example.com",
      phone: "555-0123",
    },
    { id: SAMPLE_CLIENT_ID }
  );

  const room = db.createRoom(
    {
      name: "Master Bathroom",
      description: "Primary bathroom renovation",
      clientId: client.id,
    },
    { id: SAMPLE_ROOM_ID }
  );

  const wall = db.createWall(
    {
      name: "North Wall",
      widthFeet: 8,
      heightFeet: 8,
      roomId: room.id,
    },
    { id: SAMPLE_WALL_ID }
  );

  db.createFixture(
    {
      type: "sink",
      name: "Vanity Sink",
      widthInches: 24,
      heightInches: 8,
      positionX: 24, // 2 feet from left
      positionY: 36, // 3 feet from bottom
      wallId: wall.id,
      productUrl: "https://example.com/sink",
    },
    { id: SAMPLE_FIXTURE_IDS.sink }
  );

  db.createFixture(
    {
      type: "mirror",
      name: "Wall Mirror",
      widthInches: 30,
      heightInches: 36,
      positionX: 21, // Centered above sink
      positionY: 48, // 4 feet from bottom
      wallId: wall.id,
      productUrl: "https://example.com/mirror",
    },
    { id: SAMPLE_FIXTURE_IDS.mirror }
  );

  db.createFixture(
    {
      type: "light",
      name: "Vanity Light",
      widthInches: 24,
      heightInches: 6,
      positionX: 24,
      positionY: 86, // Just above mirror
      wallId: wall.id,
      productUrl: "https://example.com/light",
    },
    { id: SAMPLE_FIXTURE_IDS.light }
  );

  db.createFixture(
    {
      type: "outlet",
      name: "GFCI Outlet",
      widthInches: 4,
      heightInches: 6,
      positionX: 60,
      positionY: 42,
      wallId: wall.id,
    },
    { id: SAMPLE_FIXTURE_IDS.outlet }
  );

  return { client, room, wall };
}

// Auto-initialize sample data on server startup
const sampleData = initializeSampleData();
export const sampleWallId = sampleData.wall.id;
