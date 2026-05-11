// ── Frontend API service — replaces all localStorage auth calls ───────────
const BASE = 'http://localhost:5000/api';

const TOKEN_KEY = 'unifyspace_token';
const USER_KEY  = 'unifyspace_current_user';

// ── Token helpers ─────────────────────────────────────────────────────────
export const getToken    = ()         => localStorage.getItem(TOKEN_KEY);
export const saveToken   = (token)    => localStorage.setItem(TOKEN_KEY, token);
export const saveUser    = (user)     => localStorage.setItem(USER_KEY, JSON.stringify(user));
export const getUser     = ()         => { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; } };
export const clearSession = ()        => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); };

const authHeaders = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

// ── Auth API ──────────────────────────────────────────────────────────────

/** Check if email already exists → { exists: boolean } */
export const checkEmail = async (email) => {
  const res = await fetch(`${BASE}/auth/check-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error((await res.json()).message);
  return res.json();
};

/** Register new user → { token, user } */
export const register = async ({ name, email, password, role, company, phone }) => {
  const res = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role, company, phone }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  saveToken(data.token);
  saveUser(data.user);
  return data.user;
};

/** Login existing user → user object */
export const login = async ({ email, password }) => {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  saveToken(data.token);
  saveUser(data.user);
  return data.user;
};

/** Update profile (protected) → updated user */
export const updateProfile = async ({ name, role, company, phone }) => {
  const res = await fetch(`${BASE}/auth/profile`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ name, role, company, phone }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  saveUser(data);
  return data;
};

/** Get current user from server (validates token) */
export const fetchMe = async () => {
  const res = await fetch(`${BASE}/auth/me`, { headers: authHeaders() });
  if (!res.ok) { clearSession(); return null; }
  return res.json();
};

// ── Leads API ─────────────────────────────────────────────────────────────

/** Save / update lead data */
export const saveLead = async (leadData) => {
  const res = await fetch(`${BASE}/leads`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(leadData),
  });
  if (!res.ok) throw new Error((await res.json()).message);
  return res.json();
};

/** Get all leads (admin) */
export const fetchLeads = async () => {
  const res = await fetch(`${BASE}/leads`, { headers: authHeaders() });
  if (!res.ok) throw new Error((await res.json()).message);
  return res.json();
};
