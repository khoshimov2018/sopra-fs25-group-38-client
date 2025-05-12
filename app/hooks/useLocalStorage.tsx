import { useEffect, useState, useCallback, useRef } from "react";

interface LocalStorage<T> {
  value: T;
  set: (newVal: T) => void;
  clear: () => void;
}

/**
 *
 * @param key
 * @param defaultValue
 * @returns
 */
export default function useLocalStorage<T>(
  key: string,
  defaultValue: T,
): LocalStorage<T> {
  const [value, setValue] = useState<T>(defaultValue);
  
  const defaultValueRef = useRef(defaultValue);

  useEffect(() => {
    if (typeof window === "undefined") return; 
    try {
      const stored = globalThis.localStorage.getItem(key);
      if (!stored) return; 
      

      if (key === "token") {
        setValue(stored as unknown as T);
        return;
      }
      
      try {
        setValue(JSON.parse(stored) as T);
      } catch (parseError) {
        if (typeof defaultValueRef.current === 'string') {
          setValue(stored as unknown as T);
        } else {
          console.error(`Failed to parse stored value for key "${key}":`, parseError);
        }
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
    }
  }, [key]);

  const set = useCallback((newVal: T) => {
    setValue(newVal);
    if (typeof window !== "undefined") {
      if (key === "token") {
        globalThis.localStorage.setItem(key, newVal as string);
      }
      else if (typeof newVal === 'string') {
        globalThis.localStorage.setItem(key, newVal as string);
      } 
      else {
        globalThis.localStorage.setItem(key, JSON.stringify(newVal));
      }
    }
  }, [key]);

  const clear = useCallback(() => {
    setValue(defaultValueRef.current);
    if (typeof window !== "undefined") {
      globalThis.localStorage.removeItem(key);
    }
  }, [key]);

  return { value, set, clear };
}
