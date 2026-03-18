import { safeSetLocalStorage, getLocalStorage } from '../utils/storage';

const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : '/api';
const CACHE_KEY = 'cms_students_cache';

export async function fetchStudents() {
  try {
    const res = await fetch(`${API_BASE}/students`);
    if (!res.ok) throw new Error('Failed to fetch');
    const data = await res.json();
    if (data.length > 0) {
      safeSetLocalStorage(CACHE_KEY, data);
      return data;
    }
  } catch {
    // Backend unavailable, fall through to cache
  }

  // Fallback: return cached data or import static data
  const cached = getLocalStorage(CACHE_KEY);
  if (cached && cached.length > 0) return cached;

  const { students } = await import('../data/studentData.js');
  safeSetLocalStorage(CACHE_KEY, students);
  return students;
}

export async function fetchStudentById(id) {
  try {
    const res = await fetch(`${API_BASE}/students/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error('Not found');
    return await res.json();
  } catch {
    // Fallback to cache
    const cached = getLocalStorage(CACHE_KEY);
    if (cached) {
      const found = cached.find(s => s.id === id);
      if (found) return found;
    }
    const { getStudentById } = await import('../data/studentData.js');
    return getStudentById(id);
  }
}

const withRetry = async (fn, attempts = 3, delay = 1000) => {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      const isRetryable = err.message === 'CONNECTION_REFUSED' || err.message === 'DATABASE_UNAVAILABLE';
      if (i === attempts - 1 || !isRetryable) throw err;
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
};

export async function createStudent(studentData) {
  const performRequest = async () => {
    try {
      const res = await fetch(`${API_BASE}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData),
      });

      if (res.status === 503) {
        throw new Error('DATABASE_UNAVAILABLE');
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: 'Failed to create student' }));
        throw new Error(errData.detail || `Server error: ${res.status}`);
      }

      return await res.json();
    } catch (error) {
      if (error.message === 'DATABASE_UNAVAILABLE') throw error;
      if (error.name === 'TypeError' || error.message.includes('fetch') || error.message.includes('NetworkError')) {
        throw new Error('CONNECTION_REFUSED');
      }
      throw error;
    }
  };

  try {
    const created = await withRetry(performRequest);
    // Update cache
    const cached = getLocalStorage(CACHE_KEY) || [];
    safeSetLocalStorage(CACHE_KEY, [created, ...cached]);
    return created;
  } catch (error) {
    throw error;
  }
}
export async function updateStudent(id, studentData) {
  const performRequest = async () => {
    try {
      const res = await fetch(`${API_BASE}/students/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData),
      });

      if (res.status === 503) throw new Error('DATABASE_UNAVAILABLE');
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: 'Failed to update student' }));
        throw new Error(errData.detail || `Server error: ${res.status}`);
      }

      return await res.json();
    } catch (error) {
      if (error.message === 'DATABASE_UNAVAILABLE') throw error;
      if (error.name === 'TypeError' || error.message.includes('fetch') || error.message.includes('NetworkError')) {
        throw new Error('CONNECTION_REFUSED');
      }
      throw error;
    }
  };

  try {
    const updated = await withRetry(performRequest);
    // Update cache
    const cached = getLocalStorage(CACHE_KEY) || [];
    const index = cached.findIndex(s => s.id === id);
    if (index !== -1) {
      cached[index] = updated;
      safeSetLocalStorage(CACHE_KEY, cached);
    }
    return updated;
  } catch (error) {
    throw error;
  }
}

export async function deleteStudent(id) {
  try {
    const res = await fetch(`${API_BASE}/students/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ detail: 'Failed to delete student' }));
      throw new Error(errData.detail || `Server error: ${res.status}`);
    }

    // Update cache
    const cached = getLocalStorage(CACHE_KEY) || [];
    const filtered = cached.filter(s => s.id !== id);
    safeSetLocalStorage(CACHE_KEY, filtered);
    
    return await res.json();
  } catch (error) {
    if (error.name === 'TypeError' || error.message.includes('fetch') || error.message.includes('NetworkError')) {
      throw new Error('CONNECTION_REFUSED');
    }
    throw error;
  }
}
