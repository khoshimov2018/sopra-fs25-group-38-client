import { useEffect, useState, useCallback, useRef } from "react";

interface LocalStorage<T> {
  value: T;
  set: (newVal: T) => void;
  clear: () => void;
}

/**
 * This custom function/hook safely handles SSR by checking
 * for the window before accessing browser localStorage.
 * IMPORTANT: It has a local react state AND a localStorage state.
 * When initializing the state with a default value,
 * clearing will revert to this default value for the state and
 * the corresponding token gets deleted in the localStorage.
 *
 * @param key - The key from localStorage, generic type T.
 * @param defaultValue - The default value if nothing is in localStorage yet.
 * @returns An object containing:
 *  - value: The current value (synced with localStorage).
 *  - set: Updates both react state & localStorage.
 *  - clear: Resets state to defaultValue and deletes localStorage key.
 */
export default function useLocalStorage<T>(
  key: string,
  defaultValue: T,
): LocalStorage<T> {
  const [value, setValue] = useState<T>(defaultValue);
  
  // Keep a reference to the defaultValue to avoid dependency changes
  const defaultValueRef = useRef(defaultValue);

  // On mount, try to read the stored value
  useEffect(() => {
    if (typeof window === "undefined") return; // SSR safeguard
    try {
      const stored = globalThis.localStorage.getItem(key);
      if (stored) {
        // For tokens, we may have stored them directly without JSON.stringify
        // If parsing fails, use the raw string (for string values like tokens)
        try {
          setValue(JSON.parse(stored) as T);
        } catch (parseError) {
          // If we expected a string type and parsing failed, use the raw string
          if (typeof defaultValueRef.current === 'string') {
            setValue(stored as unknown as T);
          } else {
            throw parseError; // Re-throw for non-string types
          }
        }
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
    }
  }, [key]); // Remove defaultValue dependency

  // Simple setter that updates both state and localStorage
  const set = useCallback((newVal: T) => {
    setValue(newVal);
    if (typeof window !== "undefined") {
      // For string values, we don't need to JSON stringify
      if (typeof newVal === 'string') {
        globalThis.localStorage.setItem(key, newVal as string);
      } else {
        globalThis.localStorage.setItem(key, JSON.stringify(newVal));
      }
    }
  }, [key]);

  // Removes the key from localStorage and resets the state
  const clear = useCallback(() => {
    setValue(defaultValueRef.current);
    if (typeof window !== "undefined") {
      globalThis.localStorage.removeItem(key);
    }
  }, [key]);

  return { value, set, clear };
}
