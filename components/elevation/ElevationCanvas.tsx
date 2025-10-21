'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { WallWithFixtures, Fixture } from '@/types';
import {
  calculateCanvasDimensions,
  drawElevation,
  exportElevationAsImage,
  pixelsToInches,
  getFixtureAtPosition,
  getFixturePixelPosition,
} from '@/lib/elevation/renderer';

interface ElevationCanvasProps {
  wall: WallWithFixtures;
  targetWidth?: number;
  onExport?: (dataUrl: string) => void;
  onFixtureUpdate?: () => void;
}

interface DragState {
  fixture: Fixture;
  offsetX: number;
  offsetY: number;
}

export default function ElevationCanvas({
  wall,
  targetWidth = 800,
  onExport,
  onFixtureUpdate,
}: ElevationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [tempWall, setTempWall] = useState<WallWithFixtures>(wall);

  // Update tempWall when wall changes (unless we're dragging)
  useEffect(() => {
    if (!dragState) {
      setTempWall(wall);
    }
  }, [wall, dragState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dimensions = calculateCanvasDimensions(tempWall, targetWidth);

    // Set canvas dimensions
    canvas.width = dimensions.width;
    canvas.height = dimensions.height + 40; // Extra space for labels

    // Draw the elevation
    drawElevation(ctx, tempWall, dimensions);
  }, [tempWall, targetWidth]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const dimensions = calculateCanvasDimensions(tempWall, targetWidth);
    const fixture = getFixtureAtPosition(tempWall, x, y, dimensions);

    if (fixture) {
      // Calculate offset from fixture top-left corner
      const fixturePixelPos = getFixturePixelPosition(fixture, tempWall.heightFeet, dimensions.pixelsPerInch);
      setDragState({
        fixture,
        offsetX: x - fixturePixelPos.x,
        offsetY: y - fixturePixelPos.y,
      });
      canvas.style.cursor = 'grabbing';
    }
  }, [tempWall, targetWidth]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (dragState) {
      // Calculate new position in pixels
      const newX = x - dragState.offsetX;
      const newY = y - dragState.offsetY;

      const dimensions = calculateCanvasDimensions(tempWall, targetWidth);

      // Convert back to inches
      const newPositionX = pixelsToInches(newX, dimensions.pixelsPerInch);
      const fixtureHeightPixels = pixelsToInches(
        dragState.fixture.heightInches,
        dimensions.pixelsPerInch
      ) * dimensions.pixelsPerInch / (tempWall.heightFeet * 12);

      // Y position is from bottom, need to convert from top
      const totalHeightPixels = dimensions.height - 40; // Subtract label space
      const newPositionY = pixelsToInches(
        totalHeightPixels - newY - fixtureHeightPixels,
        dimensions.pixelsPerInch
      );

      // Update temp wall with new position
      setTempWall(prev => ({
        ...prev,
        fixtures: prev.fixtures.map(f =>
          f.id === dragState.fixture.id
            ? { ...f, positionX: Math.max(0, newPositionX), positionY: Math.max(0, newPositionY) }
            : f
        ),
      }));
    } else {
      // Update cursor based on whether we're hovering over a fixture
      const dimensions = calculateCanvasDimensions(tempWall, targetWidth);
      const fixture = getFixtureAtPosition(tempWall, x, y, dimensions);
      canvas.style.cursor = fixture ? 'grab' : 'default';
    }
  }, [dragState, tempWall, targetWidth]);

  const handleMouseUp = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (dragState) {
      canvas.style.cursor = 'grab';

      // Find the updated fixture in tempWall
      const updatedFixture = tempWall.fixtures.find(f => f.id === dragState.fixture.id);

      if (updatedFixture) {
        // Save to API
        try {
          await fetch(`/api/fixtures/${dragState.fixture.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              positionX: updatedFixture.positionX,
              positionY: updatedFixture.positionY,
            }),
          });

          // Notify parent to refresh data
          if (onFixtureUpdate) {
            onFixtureUpdate();
          }
        } catch (error) {
          console.error('Failed to update fixture position:', error);
          // Revert to original position on error
          setTempWall(wall);
        }
      }

      setDragState(null);
    }
  }, [dragState, tempWall, wall, onFixtureUpdate]);

  const handleMouseLeave = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = 'default';
    }
    // Don't cancel drag on mouse leave - let user finish drag
  }, []);

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
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-black">
          <p className="font-semibold text-black">{wall.name}</p>
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
