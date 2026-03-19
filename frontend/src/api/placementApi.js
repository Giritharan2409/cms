const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : '/api';

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
    return result.data || [];
  } catch (error) {
    console.error('Error fetching placements:', error);
    return [];
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
    return result.data;
  } catch (error) {
    console.error('Error creating placement:', error);
    throw error;
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
    return result.data;
  } catch (error) {
    console.error('Error updating placement:', error);
    throw error;
  }
}

export async function deletePlacement(placementId) {
  try {
    const res = await fetch(`${API_BASE}/academics/placement/${encodeURIComponent(placementId)}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete placement');
    const result = await res.json();
    return result;
  } catch (error) {
    console.error('Error deleting placement:', error);
    throw error;
  }
}
