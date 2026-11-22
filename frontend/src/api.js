// All calls to the two Express servers live in this one file.
const AUTH_URL = 'http://localhost:4000';
const BLOG_URL = 'http://localhost:5000';

let onSessionExpired = () => {};
export function setOnSessionExpired(fn) {
  onSessionExpired = fn;
}

// ---------- session (kept in the browser's localStorage) ----------
function decodeToken(token) {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(base64));
}

function saveSession(accessToken, refreshToken) {
  const p = decodeToken(accessToken);
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  localStorage.setItem('user', JSON.stringify({ id: p.id, username: p.username, role: p.role }));
}

function clearSession() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
}

// ---------- when the 15-minute access token expires, get a new one ----------
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${AUTH_URL}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      clearSession();
      onSessionExpired();
      return false;
    }
    const data = await res.json();
    localStorage.setItem('accessToken', data.accessToken);
    return true;
  } catch {
    return false;
  }
}

// ---------- one helper that every call uses ----------
async function request(base, path, { method = 'GET', body, auth = false } = {}, canRetry = true) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = localStorage.getItem('accessToken');
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(base + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the server. Are both servers running?');
  }

  // Token expired? refresh it once and try the same request again
  if (res.status === 401 && auth && canRetry && (await refreshAccessToken())) {
    return request(base, path, { method, body, auth }, false);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ---------- Auth Server (port 4000) ----------
export function register(form) {
  return request(AUTH_URL, '/register', { method: 'POST', body: form });
}

export async function login(username, password) {
  const data = await request(AUTH_URL, '/login', { method: 'POST', body: { username, password } });
  saveSession(data.accessToken, data.refreshToken);
  return getSession();
}

export async function logout() {
  const refreshToken = localStorage.getItem('refreshToken');
  try {
    if (refreshToken) {
      await request(AUTH_URL, '/logout', { method: 'POST', body: { refreshToken } });
    }
  } catch {
    // even if the server is unreachable, still log out locally
  }
  clearSession();
}

// ---------- Blog API (port 5000) ----------
export const getPosts = () => request(BLOG_URL, '/api/posts');
export const getPost = (id) => request(BLOG_URL, `/api/posts/${id}`);
export const getMyPosts = () => request(BLOG_URL, '/api/me/posts', { auth: true });
export const createPost = (post) => request(BLOG_URL, '/api/posts', { method: 'POST', body: post, auth: true });
export const updatePost = (id, post) => request(BLOG_URL, `/api/posts/${id}`, { method: 'PUT', body: post, auth: true });
export const deletePost = (id) => request(BLOG_URL, `/api/posts/${id}`, { method: 'DELETE', auth: true });