export function parseCIBCDate(dateStr: string): string {
  // CIBC date format: "Month DD, YYYY"
  // Handle extra spaces in single-digit dates (e.g., "December  5, 2024")
  const cleanDate = dateStr.replace(/\s+/g, ' ').trim();
  try {
    const date = new Date(cleanDate);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }
    return date.toISOString();
  } catch {
    console.error('Error parsing date:', dateStr);
    return new Date().toISOString(); // Fallback to current date
  }
} 