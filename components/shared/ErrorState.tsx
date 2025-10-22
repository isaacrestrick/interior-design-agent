export default function ErrorState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="text-xl font-semibold text-red-900 mb-2">Unable to Load Wall</div>
          <p className="text-red-700 text-sm">There was an error loading your wall data. Please try refreshing the page.</p>
        </div>
      </div>
    </div>
  );
}

