import axios from 'axios';

// In local dev VITE_API_URL is empty and the Vite proxy forwards /api → Express.
// In production (Vercel) set VITE_API_URL to the live Render backend URL.
const backend = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
// When we talk through the local proxy (dev/preview), the request may pass a
// tunnel/iframe proxy that strips Authorization headers AND blocks third-party
// cookies. In that mode we also carry the JWT in the query string, which no
// proxy can remove. In real production (backend URL set) the header is enough,
// so we keep URLs clean there.
const throughProxy = !backend;
const api = axios.create({
  baseURL: backend ? `${backend}/api` : '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach the JWT to every request across all transports, strongest → weakest:
// Authorization header, X-Auth-Token header, first-party cookie, and (proxy mode
// only) the ?token= query param. The backend accepts whichever one survives.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('shopkart_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    config.headers['X-Auth-Token'] = token;
    const cookie = `shopkart_token=${token}`;
    if (!document.cookie.includes(cookie)) {
      document.cookie = `${cookie}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
    }
    if (throughProxy) {
      config.params = { ...(config.params || {}), token };
    }
  }
  return config;
});

/** Wipe every client-side session trace */
export const clearSession = () => {
  localStorage.removeItem('shopkart_token');
  localStorage.removeItem('shopkart_user');
  document.cookie = 'shopkart_token=; path=/; max-age=0; SameSite=Lax';
};

// 401 handling:
//  • "no token provided" = the transport got stripped somewhere → retry once
//    with the token forced into the query string before giving up.
//  • any other 401 = the session is genuinely dead → clear it and bounce to
//    /login, carrying the server's reason so the page can explain what happened.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const config = error.config;
    const url = config?.url || '';
    const reason = error.response?.data?.message || '';
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');

    if (
      status === 401 &&
      config &&
      !config._tokenRetried &&
      !isAuthEndpoint &&
      /no token provided/i.test(reason)
    ) {
      const token = localStorage.getItem('shopkart_token');
      if (token) {
        config._tokenRetried = true;
        config.params = { ...(config.params || {}), token };
        return api.request(config);
      }
    }

    if (status === 401 && !isAuthEndpoint) {
      clearSession();
      try {
        sessionStorage.setItem('shopkart_auth_notice', reason || 'Your session expired. Please log in again.');
      } catch { /* ignore */ }
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login?expired=1';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
