export default function Loading() {
  return (
    <div className="min-h-screen p-4 max-w-6xl mx-auto">
      <header className="py-6">
        <h1 className="text-2xl font-bold">Canadian Banks AI Tracker</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Loading articles...
        </p>
      </header>
      
      <main className="space-y-8">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="border rounded-lg p-4 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
} 