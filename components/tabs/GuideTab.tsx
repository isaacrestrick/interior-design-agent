import { WallWithFixtures } from '@/types';

interface GuideTabProps {
  wall: WallWithFixtures;
}

const GUIDE_STEPS = [
  {
    number: 1,
    title: 'Describe Your Design',
    description: 'Use natural language to tell the AI what fixtures you want to add to the wall elevation.',
  },
  {
    number: 2,
    title: 'Specify Details',
    description: 'Include dimensions (width × height in inches) and position (X, Y from bottom-left corner).',
  },
  {
    number: 3,
    title: 'Drag & Adjust',
    description: 'Click and drag fixtures to reposition them on the grid. Changes are saved automatically.',
  },
  {
    number: 4,
    title: 'View & Export',
    description: 'See your elevation update in real-time and export as PNG when ready to share with clients.',
  },
];

const FIXTURE_TYPES = [
  { color: 'bg-blue-500', label: 'Sink' },
  { color: 'bg-teal-400', label: 'Mirror' },
  { color: 'bg-orange-500', label: 'Light' },
  { color: 'bg-red-600', label: 'Outlet' },
  { color: 'bg-green-500', label: 'Window' },
  { color: 'bg-yellow-700', label: 'Cabinet' },
  { color: 'bg-purple-600', label: 'Door' },
  { color: 'bg-gray-500', label: 'Other' },
];

export default function GuideTab({ wall }: GuideTabProps) {
  return (
    <div className="flex-1 overflow-y-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Use</h2>
        <p className="text-gray-600">Create professional wall elevations with AI assistance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {GUIDE_STEPS.map(step => (
          <div key={step.number}>
            <div className="w-10 h-10 bg-blue-600 text-white rounded-lg mb-3 flex items-center justify-center font-bold">
              {step.number}
            </div>
            <h3 className="font-semibold mb-2 text-gray-900">{step.title}</h3>
            <p className="text-sm text-gray-600">{step.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h3 className="font-semibold mb-4 text-gray-900">Common Fixture Types</h3>
        <div className="grid grid-cols-2 gap-3">
          {FIXTURE_TYPES.map(fixture => (
            <div key={fixture.label} className="flex items-center gap-2 text-sm">
              <div className={`w-4 h-4 ${fixture.color} rounded`}></div>
              <span>{fixture.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold mb-2 text-gray-900">Quick Reference</h3>
        <div className="text-sm text-gray-700 space-y-1">
          <div><span className="font-medium">Wall Size:</span> {wall.widthFeet * 12}&quot; W × {wall.heightFeet * 12}&quot; H</div>
          <div><span className="font-medium">Scale:</span> 0.5&quot; = 1 foot</div>
          <div><span className="font-medium">Position:</span> X from left, Y from bottom (inches)</div>
        </div>
      </div>
    </div>
  );
}

