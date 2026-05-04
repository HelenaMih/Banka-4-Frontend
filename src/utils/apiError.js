/**
 * Normalizes backend error responses into a user-friendly string.
 * Handles common formats: { message }, { error }, { errors }, Go validator format.
 */
export function getErrorMessage(err, fallback = 'Došlo je do greške.') {
  if (!err) return fallback;

  // Axios interceptor in client.js already unwraps res.data on success,
  // but on error it rejects with err.response?.data ?? err.
  const data = err?.response?.data ?? err;

  if (typeof data === 'string') {
    // Go validator: "Key: 'X' Error:Field validation for 'Y' failed on the 'required' tag"
    if (data.includes("failed on the 'required' tag")) return 'Popunite sva obavezna polja.';
    if (data.startsWith('Key:')) return data.replace(/^Key:\s*/, '');
    return data;
  }

  if (data?.message && typeof data.message === 'string') return data.message;
  if (data?.error   && typeof data.error   === 'string') return data.error;

  // errors: { field: ["msg1"] } or errors: ["msg1", "msg2"]
  if (data?.errors) {
    if (Array.isArray(data.errors)) return data.errors.join(', ');
    if (typeof data.errors === 'object') {
      const parts = [];
      for (const [k, v] of Object.entries(data.errors)) {
        if (Array.isArray(v)) parts.push(`${k}: ${v.join(', ')}`);
        else if (typeof v === 'string') parts.push(`${k}: ${v}`);
      }
      if (parts.length) return parts.join(' | ');
    }
  }

  // Last resort: coerce to string and inspect
  try {
    const s = String(data);
    if (s !== '[object Object]') {
      if (s.includes("failed on the 'required' tag")) return 'Popunite sva obavezna polja.';
      if (s.startsWith('Key:')) return s.replace(/^Key:\s*/, '');
      return s;
    }
  } catch {
    // ignore
  }

  return fallback;
}
