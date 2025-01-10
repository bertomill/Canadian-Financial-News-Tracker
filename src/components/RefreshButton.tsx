'use client';

import { useState } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface RefreshButtonProps {
  onSuccess?: () => void;
}

export function RefreshButton({ onSuccess }: RefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setIsRefreshing(true);
      setProgress(null);

      const response = await fetch('/api/refresh', { method: 'POST' });
      const reader = response.body?.getReader();
      if (!reader) throw new Error('Failed to start refresh');

      // Read the stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Parse the SSE data
        const text = new TextDecoder().decode(value);
        const lines = text.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            setProgress(data.progress);
            
            // If we got the final message, trigger the success callback
            if (data.progress.includes('Added') || data.progress.includes('No new articles')) {
              if (onSuccess) onSuccess();
              // Clear progress after 5 seconds
              setTimeout(() => setProgress(null), 5000);
            }
          }
        }
      }
    } catch (error) {
      setProgress(error instanceof Error ? error.message : 'Failed to refresh');
      // Clear error after 5 seconds
      setTimeout(() => setProgress(null), 5000);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={refresh}
        disabled={isRefreshing}
        className={`
          inline-flex items-center gap-2 px-3 py-1.5 rounded
          text-sm font-medium
          ${isRefreshing 
            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
            : 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700'
          }
          transition-colors duration-200
        `}
      >
        <ArrowPathIcon 
          className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
        />
        {isRefreshing ? 'Refreshing...' : 'Refresh'}
      </button>

      {progress && (
        <span 
          className={`text-sm font-medium ${
            progress.includes('Error') 
              ? 'text-red-400'
              : progress.includes('Added') 
                ? 'text-green-400'
                : progress.includes('No new articles')
                  ? 'text-blue-400'
                  : 'text-gray-400'
          }`}
        >
          {progress}
        </span>
      )}
    </div>
  );
} 