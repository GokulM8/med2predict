import { authHeaders } from './auth';

const BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:4000';

async function handleJson(res: Response) {
  if (res.status === 401) throw new Error('Unauthorized');
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export async function listPatientsApi() {
  const res = await fetch(`${BASE_URL}/patients`, { headers: authHeaders() });
  return handleJson(res);
}

export async function getPatientApi(id: string) {
  const res = await fetch(`${BASE_URL}/patients/${id}`, { headers: authHeaders() });
  if (res.status === 404) return undefined;
  return handleJson(res);
}

export async function savePatientApi(record: { patientId: string; data: Record<string, unknown>; result?: Record<string, unknown> }) {
  // Check if patient exists first to determine if we should use POST or PUT
  try {
    const existing = await getPatientApi(record.patientId);
    if (existing) {
      // Patient exists, use update endpoint
      return updatePatientApi(record.patientId, { data: record.data, result: record.result });
    }
  } catch (err) {
    // Patient doesn't exist or error checking, proceed with POST
  }
  
  // Patient doesn't exist, create new
  const res = await fetch(`${BASE_URL}/patients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(record),
  });
  return handleJson(res);
}

export async function updatePatientApi(id: string, record: { data: Record<string, unknown>; result?: Record<string, unknown> }) {
  const res = await fetch(`${BASE_URL}/patients/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(record),
  });
  return handleJson(res);
}

export async function deletePatientApi(id: string) {
  const res = await fetch(`${BASE_URL}/patients/${id}`, { method: 'DELETE', headers: authHeaders() });
  return handleJson(res);
}

export async function loginApi(email: string, password: string) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleJson(res);
}

export async function signupApi(email: string, password: string) {
  const res = await fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleJson(res);
}

export async function meApi() {
  const res = await fetch(`${BASE_URL}/auth/me`, { headers: authHeaders() });
  return handleJson(res);
}

export async function listActivityApi() {
  const res = await fetch(`${BASE_URL}/activity`, { headers: authHeaders() });
  return handleJson(res);
}

export async function listUsersApi() {
  const res = await fetch(`${BASE_URL}/users`, { headers: authHeaders() });
  return handleJson(res);
}
export async function updateProfileApi(profile: {
  firstName?: string;
  lastName?: string;
  phone?: string;
  age?: number;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  bio?: string;
  profilePicture?: string;
}) {
  const res = await fetch(`${BASE_URL}/auth/me`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(profile),
  });
  return handleJson(res);
}