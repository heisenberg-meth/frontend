/**
 * Normalizes backend responses that are expected to be arrays.
 * Handles patterns:
 * 1. res.data.data (standard)
 * 2. res.data (direct array or wrapper)
 * 3. res.data.medicines/sales/etc (nested named keys)
 * 
 * @param {Object} response - The Axios response object
 * @param {String} fallbackKey - Optional nested key to check (e.g. 'medicines')
 * @returns {Array} - A guaranteed array
 */
export function normalizeArrayResponse(response, fallbackKey = null) {
  if (!response) return [];
  
  const data = response.data;
  if (!data) return [];

  // Case 1: Standard res.data.data
  if (Array.isArray(data.data)) return data.data;

  // Case 2: Named nested key (e.g. res.data.medicines)
  if (fallbackKey && Array.isArray(data[fallbackKey])) return data[fallbackKey];
  if (fallbackKey && data.data && Array.isArray(data.data[fallbackKey])) return data.data[fallbackKey];

  // Case 3: Direct res.data array
  if (Array.isArray(data)) return data;

  // Case 4: Object with 'items' key (common pattern)
  if (Array.isArray(data.items)) return data.items;

  // Case 5: Single object that should be an array (rare but defensive)
  if (data && typeof data === 'object' && !Array.isArray(data) && Object.keys(data).length > 0) {
     // If it has success: true but no array found, return empty
     if (data.success === true && !data.data) return [];
  }

  return [];
}

/**
 * Normalizes backend responses for single objects.
 */
export function normalizeObjectResponse(response) {
  if (!response) return null;
  const data = response.data;
  if (!data) return null;

  if (data.success && data.data) return data.data;
  return data;
}
