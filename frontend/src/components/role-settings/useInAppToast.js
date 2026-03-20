import { useCallback, useEffect, useRef, useState } from 'react';

export function useInAppToast() {
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const timeoutRef = useRef(null);

  const showToast = useCallback((message, type = 'success', timeoutMs = 2400) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setToast({ message, type });
    timeoutRef.current = setTimeout(() => {
      setToast({ message: '', type: 'success' });
      timeoutRef.current = null;
    }, timeoutMs);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    toast,
    showToast,
  };
}
