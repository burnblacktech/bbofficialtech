// =====================================================
// In-memory access token store (XSS-safe)
// The access token never touches localStorage.
// On page reload, it's re-obtained via the httpOnly refresh cookie.
// =====================================================

let _accessToken = null;

export const tokenStore = {
  get: () => _accessToken,
  set: (token) => { _accessToken = token; },
  clear: () => { _accessToken = null; },
};
