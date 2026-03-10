/**
 * Performance Optimization Utilities
 * Helper functions to improve app performance
 */

/**
 * Debounce function to limit how often a function can fire
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to ensure a function is called at most once in a specified time period
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Memoize expensive calculations
 */
export function memoize<T extends (...args: any[]) => any>(func: T): T {
  const cache = new Map();

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Check localStorage quota and available space
 */
export function checkStorageQuota(): {
  used: number;
  available: number;
  percentage: number;
} {
  let used = 0;
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      used += localStorage[key].length + key.length;
    }
  }

  // Most browsers have a 5-10MB limit for localStorage
  const available = 10 * 1024 * 1024; // Assume 10MB
  const percentage = (used / available) * 100;

  return {
    used,
    available,
    percentage,
  };
}

/**
 * Clear old/unused data from localStorage
 */
export function clearOldLocalStorageData(daysToKeep: number = 30): number {
  let itemsCleared = 0;
  const now = Date.now();
  const maxAge = daysToKeep * 24 * 60 * 60 * 1000;

  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && key !== 'printing_business_data') {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const data = JSON.parse(item);
          if (data.timestamp && now - data.timestamp > maxAge) {
            localStorage.removeItem(key);
            itemsCleared++;
          }
        }
      } catch {
        // Skip if not JSON or no timestamp
      }
    }
  }

  return itemsCleared;
}
