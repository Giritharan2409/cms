/**
 * Higher-fidelity storage utility with quota error handling
 */
export const safeSetLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return { success: true };
  } catch (e) {
    if (
      e instanceof DOMException &&
      (e.code === 22 ||
        e.code === 1014 ||
        e.name === 'QuotaExceededError' ||
        e.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    ) {
      console.warn('Storage quota exceeded for key:', key);
      return { 
        success: false, 
        error: 'QUOTA_EXCEEDED', 
        message: 'Browser storage is full. Please clear old data or use a different browser.' 
      };
    }
    return { success: false, error: 'UNKNOWN', message: e.message };
  }
};

export const getLocalStorage = (key) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
};

export const removeLocalStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // Already removed or unavailable
  }
};
