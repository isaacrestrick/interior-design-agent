'use client';

import { useEffect, useRef } from 'react';
import { WallWithFixtures } from '@/types';
import {
  calculateCanvasDimensions,
  drawElevation,
  exportElevationAsImage,
} from '@/lib/elevation/renderer';

interface ElevationCanvasProps {
  wall: WallWithFixtures;
  targetWidth?: number;
  onExport?: (dataUrl: string) => void;
}

export default function ElevationCanvas({
  wall,
  targetWidth = 800,
  onExport,
}: ElevationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dimensions = calculateCanvasDimensions(wall, targetWidth);

    // Set canvas dimensions
    canvas.width = dimensions.width;
    canvas.height = dimensions.height + 40; // Extra space for labels

    // Draw the elevation
    drawElevation(ctx, wall, dimensions);
  }, [wall, targetWidth]);

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = exportElevationAsImage(canvas);
    if (onExport) {
      onExport(dataUrl);
    } else {
      // Download the image
      const link = document.createElement('a');
      link.download = `${wall.name}-elevation.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4 bg-gray-50 overflow-auto">
        <canvas
          ref={canvasRef}
          className="mx-auto bg-white shadow-lg"
        />
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-900">
          <p className="font-semibold">{wall.name}</p>
          <p>
            {wall.widthFeet}&apos; × {wall.heightFeet}&apos; | {wall.fixtures.length} fixture(s)
          </p>
        </div>

        <button
          onClick={handleExport}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Export as PNG
        </button>
      </div>
    </div>
  );
}
