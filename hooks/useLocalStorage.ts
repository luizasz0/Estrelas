import { useState, useEffect, Dispatch, SetStateAction } from 'react';

function replacer(key: string, value: any) {
  if(value instanceof Map) {
    return {
      dataType: 'Map',
      value: Array.from(value.entries()),
    };
  } else {
    return value;
  }
}

function reviver(key: string, value: any) {
  if(typeof value === 'object' && value !== null) {
    if (value.dataType === 'Map') {
      return new Map(value.value);
    }
  }
  return value;
}


export function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      // FIX: Cast the result of JSON.parse to T. By default, it returns `any`,
      // which caused the state to be inferred as `any` and led to type errors
      // in components consuming this state.
      return item ? JSON.parse(item, reviver) as T : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore, replacer));
    } catch (error) {
      console.log(error);
    }
  };
  
  useEffect(() => {
     const handleStorageChange = (e: StorageEvent) => {
        if (e.key === key && e.newValue) {
            // FIX: Also cast here to ensure type safety when storage changes in another tab.
            setStoredValue(JSON.parse(e.newValue, reviver) as T);
        }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);

  return [storedValue, setValue as Dispatch<SetStateAction<T>>];
}
