import { useEffect, useState } from "react";

interface WindowSize {
  width: number;
  height: number;
}

interface UseWindowSizeReturn {
  windowSize: WindowSize;
  isMobile: boolean;
  isDesktop: boolean;
}

const useWindowSize = (): UseWindowSizeReturn => {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    // Only run in browser environment
    if (typeof window !== "undefined") {
      // Add event listener
      window.addEventListener("resize", handleResize);
      
      // Set initial dimensions
      handleResize();
      
      // Clean up event listener
      return () => window.removeEventListener("resize", handleResize);
    }
    
    // Empty return for SSR
    return undefined;
  }, []);

  return {
    windowSize,
    isMobile: windowSize.width < 768,
    isDesktop: windowSize.width >= 768,
  };
};

export default useWindowSize;
