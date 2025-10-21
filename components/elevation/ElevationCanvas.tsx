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
    <div className="space-y-6 h-full flex flex-col">
      <div className="relative border-2 border-gray-200 rounded-2xl p-6 bg-gradient-to-br from-gray-50 to-blue-50 overflow-hidden shadow-inner flex-1 flex flex-col min-h-0">
        {dragState && (
          <div className="absolute top-4 right-4 z-10 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 animate-fade-in">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            Dragging fixture...
          </div>
        )}
        {isSaving && (
          <div className="absolute top-4 right-4 z-10 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 animate-fade-in">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Saving...
          </div>
        )}
        <div className="flex-1 flex items-center justify-center min-h-0">
          <canvas
            ref={canvasRef}
            className="bg-white shadow-2xl rounded-lg border border-gray-300 hover:shadow-3xl transition-shadow duration-300 max-w-full max-h-full object-contain"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          />
        </div>
        <div className="mt-4 text-center flex-shrink-0">
          <p className="text-xs text-gray-500 italic">Click and drag fixtures to reposition them on the elevation</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50 rounded-xl p-4 border border-gray-200">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
              <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              <span className="font-medium text-gray-700">{wall.fixtures.length} Fixture{wall.fixtures.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="font-medium text-gray-700">{wall.widthFeet}&apos; × {wall.heightFeet}&apos; Wall</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl font-medium text-sm"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export as PNG
        </button>
      </div>
    </div>
  );
}
