import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to persist state in localStorage
 * @param key - The localStorage key
 * @param initialValue - The initial value if nothing is stored
 * @returns [storedValue, setValue] - Tuple similar to useState
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Get stored value or use initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Update localStorage when value changes
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Wrapper to match useState API (supports both direct values and updater functions)
  // Use useCallback to prevent infinite re-renders
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      setStoredValue(prevValue => {
        const valueToStore = value instanceof Function ? value(prevValue) : value;
        return valueToStore;
      });
    } catch (error) {
      console.warn(`Error updating state for key "${key}":`, error);
    }
  }, [key]);

  return [storedValue, setValue];
}


