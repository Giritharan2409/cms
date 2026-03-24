const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : '/api';
const CACHE_KEY = 'cms_placements_cache';

function getCachedPlacements() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
}

function setCachedPlacements(placements) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(placements));
  } catch {
    // localStorage full or unavailable
  }
}

function filterPlacements(items, { status, search, personId } = {}) {
  let filtered = [...items];
  if (status && status !== 'All') {
    filtered = filtered.filter(item => item.status === status);
  }
  if (personId) {
    filtered = filtered.filter(item => item.ownerId === personId);
  }
  if (search) {
    const needle = search.toLowerCase();
    filtered = filtered.filter(item =>
      String(item.name || '').toLowerCase().includes(needle)
      || String(item.company || '').toLowerCase().includes(needle)
    );
  }
  return filtered;
}

export async function fetchPlacements({ status, search, personId } = {}) {
  try {
    const params = new URLSearchParams();
    if (status && status !== 'All') params.append('status', status);
    if (search) params.append('search', search);
    if (personId) params.append('person_id', personId);

    const queryString = params.toString();
    const url = queryString ? `${API_BASE}/academics/placement?${queryString}` : `${API_BASE}/academics/placement`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch placements');
    const result = await res.json();
    const data = result.data || [];
    setCachedPlacements(data);
    return data;
  } catch (error) {
    console.error('Error fetching placements:', error);
    const cached = getCachedPlacements();
    return filterPlacements(cached, { status, search, personId });
  }
}

export async function createPlacement(placementData) {
  try {
    const res = await fetch(`${API_BASE}/academics/placement`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(placementData),
    });
    if (!res.ok) throw new Error('Failed to create placement');
    const result = await res.json();
    const created = result.data || result;
    const cached = getCachedPlacements();
    setCachedPlacements([created, ...cached]);
    return created;
  } catch (error) {
    console.error('Error creating placement:', error);
    const cached = getCachedPlacements();
    const fallback = {
      id: `placement_${Date.now().toString(36)}`,
      ...placementData,
    };
    setCachedPlacements([fallback, ...cached]);
    return fallback;
  }
}

export async function updatePlacement(placementId, placementData) {
  try {
    const res = await fetch(`${API_BASE}/academics/placement/${encodeURIComponent(placementId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(placementData),
    });
    if (!res.ok) throw new Error('Failed to update placement');
    const result = await res.json();
    const updated = result.data || result;
    const cached = getCachedPlacements();
    const next = cached.map(item => (item.id === placementId ? { ...item, ...updated } : item));
    setCachedPlacements(next);
    return updated;
  } catch (error) {
    console.error('Error updating placement:', error);
    const cached = getCachedPlacements();
    const next = cached.map(item => (item.id === placementId ? { ...item, ...placementData } : item));
    setCachedPlacements(next);
    return next.find(item => item.id === placementId);
  }
}

export async function deletePlacement(placementId) {
  try {
    const res = await fetch(`${API_BASE}/academics/placement/${encodeURIComponent(placementId)}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete placement');
    const result = await res.json();
    const cached = getCachedPlacements();
    setCachedPlacements(cached.filter(item => item.id !== placementId));
    return result;
  } catch (error) {
    console.error('Error deleting placement:', error);
    const cached = getCachedPlacements();
    setCachedPlacements(cached.filter(item => item.id !== placementId));
    return { success: true };
  }
}
