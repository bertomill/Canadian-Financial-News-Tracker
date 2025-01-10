'use client';

import { useEffect, useState } from 'react';

interface DateDisplayProps {
  date: string;
  format?: 'short' | 'long';
}

export function DateDisplay({ date, format = 'short' }: DateDisplayProps) {
  // Create a consistent initial format that matches server and client
  const initialDate = new Date(date);
  const initialFormat = initialDate.toISOString().split('T')[0];
  
  const [formattedDate, setFormattedDate] = useState(initialFormat);

  useEffect(() => {
    // After hydration, format the date according to locale preferences
    const d = new Date(date);
    if (format === 'short') {
      setFormattedDate(d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }));
    } else {
      setFormattedDate(d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }));
    }
  }, [date, format]);

  return <span>{formattedDate}</span>;
} 