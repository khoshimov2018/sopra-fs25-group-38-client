'use client';

import { useEffect, useState } from 'react';

export default function ClientOnly({ children }: { children: React.ReactNode }) {
  // State to track if component is mounted
  const [isMounted, setIsMounted] = useState(false);

  // Only show the children when mounted on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return <>{children}</>;
}