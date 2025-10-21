'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { WallWithFixtures, Fixture } from '@/types';
import {
  calculateCanvasDimensions,
  drawElevation,
  exportElevationAsImage,
  pixelsToInches,
  inchesToPixels,
  getFixtureAtPosition,
  getFixturePixelPosition,
} from '@/lib/elevation/renderer';

interface ElevationCanvasProps {
  wall: WallWithFixtures;
  targetWidth?: number;
  onExport?: (dataUrl: string) => void;
  onFixtureUpdate?: () => Promise<void> | void;
}

interface DragState {
  fixture: Fixture;
  offsetX: number;
  offsetY: number;
}

interface PendingUpdate {
  fixtureId: string;
  positionX: number;
  positionY: number;
  sourceWall: WallWithFixtures;
}

const POSITION_EPSILON = 0.05;

export default function ElevationCanvas({
  wall,
  targetWidth = 800,
  onExport,
  onFixtureUpdate,
}: ElevationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [tempWall, setTempWall] = useState<WallWithFixtures>(wall);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<PendingUpdate | null>(null);
  const latestDragPositionRef = useRef<{ positionX: number; positionY: number } | null>(null);

  // Sync temp wall with server data once drag finishes and the updated wall arrives.
  useEffect(() => {
    if (dragState) {
      return;
    }

    if (pendingUpdate) {
      if (wall !== pendingUpdate.sourceWall) {
        const incomingFixture = wall.fixtures.find(f => f.id === pendingUpdate.fixtureId);

        if (incomingFixture) {
          const deltaX = Math.abs(incomingFixture.positionX - pendingUpdate.positionX);
          const deltaY = Math.abs(incomingFixture.positionY - pendingUpdate.positionY);

          if (deltaX <= POSITION_EPSILON && deltaY <= POSITION_EPSILON) {
            const adjustedWall: WallWithFixtures = {
              ...wall,
              fixtures: wall.fixtures.map(f =>
                f.id === pendingUpdate.fixtureId
                  ? {
                      ...f,
                      positionX: pendingUpdate.positionX,
                      positionY: pendingUpdate.positionY,
                    }
                  : f
              ),
            };
            setTempWall(adjustedWall);
            setPendingUpdate(null);
            return;
          }
        }

        setTempWall(wall);
        setPendingUpdate(null);
      }
      return;
    }

    if (!isSaving) {
      setTempWall(wall);
    }
  }, [wall, dragState, isSaving, pendingUpdate]);

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
      latestDragPositionRef.current = {
        positionX: fixture.positionX,
        positionY: fixture.positionY,
      };
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
      const fixtureHeightPixels = inchesToPixels(
        dragState.fixture.heightInches,
        dimensions.pixelsPerInch
      );

      // Y position is from bottom, need to convert from top
      const totalHeightPixels = dimensions.height;
      const unclampedPositionY = pixelsToInches(
        totalHeightPixels - newY - fixtureHeightPixels,
        dimensions.pixelsPerInch
      );
      const clampedPositionX = Math.max(0, newPositionX);
      const clampedPositionY = Math.max(0, unclampedPositionY);

      // Update temp wall with new position
      setTempWall(prev => ({
        ...prev,
        fixtures: prev.fixtures.map(f =>
          f.id === dragState.fixture.id
            ? { ...f, positionX: clampedPositionX, positionY: clampedPositionY }
            : f
        ),
      }));
      latestDragPositionRef.current = {
        positionX: clampedPositionX,
        positionY: clampedPositionY,
      };
    } else {
      // Update cursor based on whether we're hovering over a fixture
      const dimensions = calculateCanvasDimensions(tempWall, targetWidth);
      const fixture = getFixtureAtPosition(tempWall, x, y, dimensions);
      canvas.style.cursor = fixture ? 'grab' : 'default';
    }
  }, [dragState, tempWall, targetWidth]);

  const handleMouseUp = useCallback(async (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (dragState) {
      canvas.style.cursor = 'grab';

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const dimensions = calculateCanvasDimensions(tempWall, targetWidth);
      const newX = x - dragState.offsetX;
      const newY = y - dragState.offsetY;
      const fixtureHeightPixels = inchesToPixels(
        dragState.fixture.heightInches,
        dimensions.pixelsPerInch
      );
      const totalHeightPixels = dimensions.height;

      const rawPositionX = pixelsToInches(newX, dimensions.pixelsPerInch);
      const rawPositionY = pixelsToInches(
        totalHeightPixels - newY - fixtureHeightPixels,
        dimensions.pixelsPerInch
      );

      const finalPositionX = Math.max(0, rawPositionX);
      const finalPositionY = Math.max(0, rawPositionY);

      setTempWall(prev => ({
        ...prev,
        fixtures: prev.fixtures.map(f =>
          f.id === dragState.fixture.id
            ? { ...f, positionX: finalPositionX, positionY: finalPositionY }
            : f
        ),
      }));

      latestDragPositionRef.current = {
        positionX: finalPositionX,
        positionY: finalPositionY,
      };

      // Save to API
      setIsSaving(true);
      setPendingUpdate({
        fixtureId: dragState.fixture.id,
        positionX: finalPositionX,
        positionY: finalPositionY,
        sourceWall: wall,
      });
      try {
        const response = await fetch(`/api/fixtures/${dragState.fixture.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            positionX: finalPositionX,
            positionY: finalPositionY,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to update fixture: ${response.status}`);
        }

        // Ask parent to refresh data now that the server accepted the update
        if (onFixtureUpdate) {
          await onFixtureUpdate();
        } else {
          setPendingUpdate(null);
        }
      } catch (error) {
        console.error('Failed to update fixture position:', error);
        // Revert to original position on error
        setPendingUpdate(null);
        setTempWall(wall);
      } finally {
        latestDragPositionRef.current = null;
        setDragState(null);
        setIsSaving(false);
      }
    }
  }, [dragState, tempWall, targetWidth, wall, onFixtureUpdate]);

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
