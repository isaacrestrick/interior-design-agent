'use client';

import { Fixture } from '@/types';

interface FixtureListProps {
  fixtures: Fixture[];
  onEdit?: (fixture: Fixture) => void;
  onDelete?: (fixtureId: string) => void;
}

// Map fixture types to colors
const getFixtureColor = (type: string): string => {
  const colors: Record<string, string> = {
    sink: 'bg-blue-500',
    mirror: 'bg-teal-400',
    light: 'bg-orange-500',
    outlet: 'bg-red-600',
    window: 'bg-green-500',
    cabinet: 'bg-yellow-700',
    door: 'bg-purple-600',
    default: 'bg-gray-500',
  };
  return colors[type.toLowerCase()] || colors.default;
};

export default function FixtureList({
  fixtures,
  onEdit,
  onDelete,
}: FixtureListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
          Fixtures
        </h3>
        <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-semibold rounded-full shadow-md">
          {fixtures.length} Total
        </span>
      </div>

      {fixtures.length === 0 ? (
        <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-dashed border-gray-300">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-gray-600 font-medium text-lg mb-2">No fixtures added yet</p>
          <p className="text-gray-500 text-sm">Use the AI chat to add fixtures to your wall elevation</p>
        </div>
      ) : (
        <div className="space-y-3">
          {fixtures.map((fixture, index) => (
            <div
              key={fixture.id}
              className="group border-2 border-gray-200 rounded-2xl p-5 bg-white hover:bg-gradient-to-br hover:from-white hover:to-blue-50 hover:border-blue-300 transition-all duration-300 hover:shadow-lg animate-slide-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-3 h-3 rounded-full ${getFixtureColor(fixture.type)} shadow-md`}></div>
                    <span className="px-3 py-1 text-xs font-bold bg-gradient-to-r from-blue-100 to-purple-100 text-gray-800 rounded-full uppercase tracking-wide">
                      {fixture.type}
                    </span>
                    <h4 className="font-bold text-gray-900 text-lg">{fixture.name}</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                      <span className="font-medium">{fixture.widthInches}&quot; W × {fixture.heightInches}&quot; H</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="font-medium">({fixture.positionX.toFixed(1)}&quot;, {fixture.positionY.toFixed(1)}&quot;)</span>
                    </div>
                  </div>

                  {fixture.productUrl && (
                    <a
                      href={fixture.productUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium group/link"
                    >
                      <svg className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      View Product Details
                    </a>
                  )}

                  {fixture.notes && (
                    <div className="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
                      <p className="text-sm text-gray-700 italic flex items-start gap-2">
                        <svg className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        {fixture.notes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(fixture)}
                      className="p-2 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md group/btn"
                      title="Edit fixture"
                    >
                      <svg className="w-5 h-5 text-gray-700 group-hover/btn:text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(fixture.id)}
                      className="p-2 bg-gradient-to-r from-red-100 to-red-200 hover:from-red-200 hover:to-red-300 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md group/btn"
                      title="Delete fixture"
                    >
                      <svg className="w-5 h-5 text-red-700 group-hover/btn:text-red-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
