import { WallWithFixtures } from '@/types';

interface WallInfoProps {
  wall: WallWithFixtures;
}

export default function WallInfo({ wall }: WallInfoProps) {
  const handleExport = () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${wall.name}-elevation.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="flex flex-col gap-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
      <div>
        <h2 className="font-semibold text-gray-900 text-sm mb-3">{wall.name}</h2>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-1.5 text-gray-600">
            <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
            <span>{wall.fixtures.length} Fixture{wall.fixtures.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600">
            <svg className="w-3.5 h-3.5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>{wall.widthFeet}&apos; × {wall.heightFeet}&apos;</span>
          </div>
        </div>
      </div>
      <button
        onClick={handleExport}
        className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium text-xs whitespace-nowrap"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Export PNG
      </button>
    </div>
  );
}

