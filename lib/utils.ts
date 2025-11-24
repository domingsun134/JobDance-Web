// Format date from YYYY-MM-DD or YYYY-MM to MMM YYYY
export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  
  // Handle YYYY-MM-DD format
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
  
  // Handle YYYY-MM format
  if (dateStr.match(/^\d{4}-\d{2}$/)) {
    const date = new Date(dateStr + '-01T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
  
  return dateStr;
}

// Format date range
export function formatDateRange(startDate: string, endDate: string | null, current: boolean): string {
  const start = formatDate(startDate);
  if (current) {
    return `${start} - Present`;
  }
  if (endDate) {
    const end = formatDate(endDate);
    return `${start} - ${end}`;
  }
  return start;
}

