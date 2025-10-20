'use client';

import { Fixture } from '@/types';

interface FixtureListProps {
  fixtures: Fixture[];
  onEdit?: (fixture: Fixture) => void;
  onDelete?: (fixtureId: string) => void;
}

export default function FixtureList({
  fixtures,
  onEdit,
  onDelete,
}: FixtureListProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">Fixtures</h3>

      {fixtures.length === 0 ? (
        <p className="text-gray-500 text-sm">No fixtures added yet.</p>
      ) : (
        <div className="space-y-2">
          {fixtures.map((fixture) => (
            <div
              key={fixture.id}
              className="border rounded-lg p-3 bg-white hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                      {fixture.type}
                    </span>
                    <h4 className="font-medium">{fixture.name}</h4>
                  </div>

                  <div className="mt-2 text-sm text-gray-600 space-y-1">
                    <p>
                      Size: {fixture.widthInches}&quot; W × {fixture.heightInches}&quot; H
                    </p>
                    <p>
                      Position: ({fixture.positionX}&quot;, {fixture.positionY}&quot;) from bottom-left
                    </p>
                    {fixture.productUrl && (
                      <a
                        href={fixture.productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View Product
                      </a>
                    )}
                    {fixture.notes && (
                      <p className="text-gray-500 italic">{fixture.notes}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(fixture)}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                    >
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(fixture.id)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded transition-colors"
                    >
                      Delete
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
