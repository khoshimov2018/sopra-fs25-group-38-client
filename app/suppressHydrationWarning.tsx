'use client';
import { useEffect } from 'react';

export default function SuppressHydrationWarning() {
  useEffect(() => {
    // hydration warning caused by browser extensions so no need to fix and only shown on some browsers
    const originalConsoleError = console.error;
    console.error = function(...args: any[]) {
      if (args[0]?.includes('Warning: Text content did not match') ||
          args[0]?.includes('Warning: Prop `className` did not match') ||
          args[0]?.includes('Hydration failed because')) {
        return;
      }
      return originalConsoleError.apply(this, args);
    };
    
    return () => {
      console.error = originalConsoleError;
    };
  }, []);
  
  return null;
}