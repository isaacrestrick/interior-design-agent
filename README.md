# Interior Design Agent

An AI-powered web application for interior designers to create wall elevations with natural language commands.

## Overview

Interior designers can describe their design vision in plain English, and the AI agent will automatically create accurate wall elevations with fixtures positioned to scale. The system uses a standard architectural scale of **1/2" = 1'-0"** for all drawings.

## Features

- **Natural Language Interface**: Tell the AI what fixtures to add using simple descriptions
- **Accurate Scale Drawings**: All elevations are drawn to the industry-standard 1/2" = 1'-0" scale
- **Real-time Visualization**: See your elevation update instantly as you add fixtures
- **Export Capabilities**: Download elevations as PNG images for client presentations
- **Fixture Management**: Add, edit, and delete fixtures with full control
- **Product URL Tracking**: Associate product links with each fixture for easy reference

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Styling
- **HTML5 Canvas** - Elevation rendering
- **Anthropic Claude AI** - Natural language processing
- **AI SDK** - AI integration framework

## Getting Started

### Prerequisites

- Node.js 18+ installed
- (Optional) Anthropic API key for AI features

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Edit .env and add your API key
```

Edit `.env` and add your Anthropic API key:
```
ANTHROPIC_API_KEY=your-actual-api-key-here
```

> **Note**: The app works without an API key, but you'll need to manually format your instructions. With an API key, the AI can understand natural language better.

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Understanding Wall Elevations

An **elevation** is a straight-on view of a wall showing all fixtures, outlets, and features at their actual positions and sizes. For example, a bathroom wall elevation might show:

- Sink at counter height
- Mirror above the sink
- Light fixture above the mirror
- Electrical outlets at standard heights

### Using the AI Agent

The AI agent accepts natural language commands. Here are some examples:

#### Basic Commands

```
Add a 24 by 8 inch sink at position 30, 36
```

```
Place a 30 by 36 inch mirror at 27 inches from left, 48 inches from bottom
```

```
Add a 24 by 6 inch vanity light centered at 78 inches high
```

```
Put a 4 by 6 inch GFCI outlet at 60, 42
```

#### Understanding Positions

- **X Position**: Distance from the LEFT edge of the wall (in inches)
- **Y Position**: Distance from the BOTTOM edge of the wall (in inches)
- Positions are in actual inches, not scaled

For an 8-foot wide wall:
- X can be 0 to 96 inches (8 feet × 12 inches/foot)
- For an 8-foot tall wall:
- Y can be 0 to 96 inches

### Standard Fixture Heights

The system knows these standard interior design heights:

- **Electrical Outlets**: 12-18" from floor
- **Light Switches**: 48" from floor
- **Vanity Sinks**: 30-36" from floor (to top of sink)
- **Mirrors**: 40-72" from floor
- **Vanity Lights**: 75-80" from floor
- **Windows**: 36-48" from floor (sill height)

### Exporting Elevations

Click the "Export as PNG" button to download your elevation as an image file. The exported image includes:

- Scaled elevation drawing
- Dimension labels
- Scale notation
- All fixture details

## Project Structure

```
interior-design-agent/
├── app/
│   ├── api/
│   │   ├── ai-agent/          # AI natural language processing
│   │   ├── fixtures/          # Fixture CRUD operations
│   │   └── walls/             # Wall data endpoints
│   └── page.tsx               # Main application page
├── components/
│   ├── elevation/
│   │   ├── ElevationCanvas.tsx    # Canvas-based elevation renderer
│   │   └── FixtureList.tsx        # Fixture list UI
│   └── AIAgentChat.tsx            # AI chat interface
├── lib/
│   ├── db.ts                      # In-memory database
│   └── elevation/
│       └── renderer.ts            # Elevation drawing logic
├── types/
│   └── index.ts                   # TypeScript type definitions
└── prisma/
    └── schema.prisma              # Database schema
```

## Data Model

### Client
- Basic client information (name, email, phone)

### Room
- Associated with a client
- Contains multiple walls

### Wall
- Dimensions (width and height in feet)
- Associated with a room
- Contains multiple fixtures

### Fixture
- Type (sink, mirror, light, outlet, etc.)
- Dimensions (width and height in inches)
- Position (X, Y from bottom-left corner in inches)
- Optional product URL and notes

## Scale System

The application uses the architectural scale of **1/2" = 1'-0"**:

- 1 foot in real life = 0.5 inches on the drawing
- An 8-foot wide wall = 4 inches on the drawing
- A 24-inch fixture = 1 inch on the drawing

This is automatically calculated by the rendering system.

## Future Enhancements

Potential features to add:

- [ ] Multiple wall management
- [ ] Room templates (bathroom, kitchen, bedroom)
- [ ] 3D visualization
- [ ] PDF export with project details
- [ ] Collaboration features
- [ ] Material and cost tracking
- [ ] Integration with product catalogs
- [ ] Persistent database storage (PostgreSQL/SQLite)
- [ ] User authentication and projects
- [ ] Mobile responsive design improvements

## API Endpoints

### GET /api/walls/[id]
Get wall details with all fixtures.

### POST /api/fixtures
Create a new fixture.

**Body:**
```json
{
  "type": "sink",
  "name": "Vanity Sink",
  "widthInches": 24,
  "heightInches": 8,
  "positionX": 30,
  "positionY": 36,
  "wallId": "wall-id",
  "productUrl": "https://example.com/product",
  "notes": "Optional notes"
}
```

### PATCH /api/fixtures/[id]
Update fixture properties.

### DELETE /api/fixtures/[id]
Delete a fixture.

### POST /api/ai-agent
Process natural language instruction.

**Body:**
```json
{
  "instruction": "Add a 24 by 8 inch sink at position 30, 36",
  "wallId": "wall-id"
}
```

## Development

### Building for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## License

MIT License - feel free to use this for your projects!

---

Built with Next.js and Claude AI
