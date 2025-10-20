import { WallWithFixtures, Fixture, SCALE_INCHES_PER_FOOT } from '@/types';

export interface DrawingDimensions {
  width: number;  // Canvas width in pixels
  height: number; // Canvas height in pixels
  pixelsPerInch: number; // Scale factor for drawing
}

// Convert real dimensions to drawing pixels
export function feetToPixels(feet: number, pixelsPerInch: number): number {
  const drawingInches = feet * SCALE_INCHES_PER_FOOT;
  return drawingInches * pixelsPerInch;
}

export function inchesToPixels(inches: number, pixelsPerInch: number): number {
  const drawingInches = inches * SCALE_INCHES_PER_FOOT / 12;
  return drawingInches * pixelsPerInch;
}

// Calculate optimal canvas dimensions for a wall
export function calculateCanvasDimensions(
  wall: WallWithFixtures,
  targetWidth: number = 800
): DrawingDimensions {
  // Calculate drawing dimensions based on scale (0.5" = 1')
  const drawingWidthInches = wall.widthFeet * SCALE_INCHES_PER_FOOT;
  const drawingHeightInches = wall.heightFeet * SCALE_INCHES_PER_FOOT;

  // Calculate pixels per inch to fit target width
  const pixelsPerInch = targetWidth / drawingWidthInches;

  return {
    width: Math.round(drawingWidthInches * pixelsPerInch),
    height: Math.round(drawingHeightInches * pixelsPerInch),
    pixelsPerInch,
  };
}

// Fixture type colors
const FIXTURE_COLORS: Record<string, string> = {
  sink: '#4A90E2',
  mirror: '#50E3C2',
  light: '#F5A623',
  outlet: '#D0021B',
  window: '#7ED321',
  cabinet: '#8B572A',
  door: '#BD10E0',
  default: '#9B9B9B',
};

export function drawElevation(
  ctx: CanvasRenderingContext2D,
  wall: WallWithFixtures,
  dimensions: DrawingDimensions
): void {
  const { width, height, pixelsPerInch } = dimensions;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Draw wall background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Draw wall border
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, width, height);

  // Draw grid (every foot)
  ctx.strokeStyle = '#E0E0E0';
  ctx.lineWidth = 0.5;

  // Vertical grid lines (every foot)
  for (let feet = 1; feet < wall.widthFeet; feet++) {
    const x = feetToPixels(feet, pixelsPerInch);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Horizontal grid lines (every foot)
  for (let feet = 1; feet < wall.heightFeet; feet++) {
    const y = height - feetToPixels(feet, pixelsPerInch);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Draw fixtures
  wall.fixtures.forEach(fixture => {
    drawFixture(ctx, fixture, wall.heightFeet, pixelsPerInch);
  });

  // Draw dimensions and labels
  drawDimensions(ctx, wall, dimensions);
}

function drawFixture(
  ctx: CanvasRenderingContext2D,
  fixture: Fixture,
  wallHeightFeet: number,
  pixelsPerInch: number
): void {
  // Convert fixture position and size to pixels
  const x = inchesToPixels(fixture.positionX, pixelsPerInch);
  const fixtureWidth = inchesToPixels(fixture.widthInches, pixelsPerInch);
  const fixtureHeight = inchesToPixels(fixture.heightInches, pixelsPerInch);

  // Y position is from bottom, so we need to flip it
  const totalHeightPixels = feetToPixels(wallHeightFeet, pixelsPerInch);
  const y = totalHeightPixels - inchesToPixels(fixture.positionY, pixelsPerInch) - fixtureHeight;

  // Get color for fixture type
  const color = FIXTURE_COLORS[fixture.type.toLowerCase()] || FIXTURE_COLORS.default;

  // Draw fixture rectangle
  ctx.fillStyle = color + '40'; // Add transparency
  ctx.fillRect(x, y, fixtureWidth, fixtureHeight);

  // Draw fixture border
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, fixtureWidth, fixtureHeight);

  // Draw fixture label
  ctx.fillStyle = '#000000';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const labelX = x + fixtureWidth / 2;
  const labelY = y + fixtureHeight / 2;

  // Draw text background for readability
  const textMetrics = ctx.measureText(fixture.name);
  const textWidth = textMetrics.width;
  const textHeight = 16;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fillRect(
    labelX - textWidth / 2 - 2,
    labelY - textHeight / 2,
    textWidth + 4,
    textHeight
  );

  ctx.fillStyle = '#000000';
  ctx.fillText(fixture.name, labelX, labelY);

  // Draw dimension labels
  ctx.font = '10px Arial';
  ctx.fillStyle = '#666666';

  // Width dimension
  const widthText = `${fixture.widthInches}"`;
  ctx.fillText(widthText, x + fixtureWidth / 2, y - 5);

  // Height dimension
  ctx.save();
  ctx.translate(x - 5, y + fixtureHeight / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(`${fixture.heightInches}"`, 0, 0);
  ctx.restore();
}

function drawDimensions(
  ctx: CanvasRenderingContext2D,
  wall: WallWithFixtures,
  dimensions: DrawingDimensions
): void {
  const { width, height } = dimensions;

  // Draw wall dimensions
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';

  // Wall width
  ctx.fillText(`${wall.widthFeet}' - 0"`, width / 2, height + 20);

  // Wall height
  ctx.save();
  ctx.translate(-20, height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(`${wall.heightFeet}' - 0"`, 0, 0);
  ctx.restore();

  // Scale notation
  ctx.font = '12px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`Scale: 1/2" = 1'-0"`, 10, height + 20);
}

// Export elevation as data URL (for download)
export function exportElevationAsImage(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png');
}

// Generate SVG version (alternative to canvas)
export function generateElevationSVG(
  wall: WallWithFixtures,
  dimensions: DrawingDimensions
): string {
  const { width, height, pixelsPerInch } = dimensions;

  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;

  // Background
  svg += `<rect width="${width}" height="${height}" fill="white" stroke="black" stroke-width="2"/>`;

  // Grid
  for (let feet = 1; feet < wall.widthFeet; feet++) {
    const x = feetToPixels(feet, pixelsPerInch);
    svg += `<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="#E0E0E0" stroke-width="0.5"/>`;
  }

  for (let feet = 1; feet < wall.heightFeet; feet++) {
    const y = height - feetToPixels(feet, pixelsPerInch);
    svg += `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="#E0E0E0" stroke-width="0.5"/>`;
  }

  // Fixtures
  wall.fixtures.forEach(fixture => {
    const x = inchesToPixels(fixture.positionX, pixelsPerInch);
    const fixtureWidth = inchesToPixels(fixture.widthInches, pixelsPerInch);
    const fixtureHeight = inchesToPixels(fixture.heightInches, pixelsPerInch);
    const totalHeightPixels = feetToPixels(wall.heightFeet, pixelsPerInch);
    const y = totalHeightPixels - inchesToPixels(fixture.positionY, pixelsPerInch) - fixtureHeight;

    const color = FIXTURE_COLORS[fixture.type.toLowerCase()] || FIXTURE_COLORS.default;

    svg += `<rect x="${x}" y="${y}" width="${fixtureWidth}" height="${fixtureHeight}" ` +
           `fill="${color}40" stroke="${color}" stroke-width="2"/>`;

    svg += `<text x="${x + fixtureWidth / 2}" y="${y + fixtureHeight / 2}" ` +
           `text-anchor="middle" dominant-baseline="middle" font-size="12" fill="black">${fixture.name}</text>`;
  });

  // Dimensions
  svg += `<text x="${width / 2}" y="${height + 20}" text-anchor="middle" font-size="14" font-weight="bold">` +
         `${wall.widthFeet}' - 0"</text>`;

  svg += `</svg>`;

  return svg;
}
