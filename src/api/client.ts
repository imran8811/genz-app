import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, STORAGE_KEYS } from '@/config';

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  auth?: boolean;
  signal?: AbortSignal;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = false, signal } = opts;

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  if (auth) {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.token);
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch {
    throw new ApiError(
      'Unable to reach the server. Check your internet connection and try again.',
      0,
      null,
    );
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    throw new ApiError(messageFrom(data, res.status), res.status, data);
  }

  return data as T;
}

/** Extract a friendly message from a Laravel error response. */
function messageFrom(data: unknown, status: number): string {
  if (typeof data === 'string' && data.trim()) return data;
  if (data && typeof data === 'object') {
    const obj = data as { errors?: Record<string, string[]>; message?: string };
    if (obj.errors) {
      const first = Object.keys(obj.errors)[0];
      const list = first ? obj.errors[first] : null;
      if (list?.length) return list[0];
    }
    if (obj.message) return obj.message;
  }
  if (status === 401) return 'Please sign in to continue.';
  return 'Something went wrong. Please try again.';
}

export const api = {
  get: <T>(path: string, auth = false, signal?: AbortSignal) =>
    request<T>(path, { method: 'GET', auth, signal }),
  post: <T>(path: string, body: unknown, auth = false) =>
    request<T>(path, { method: 'POST', body, auth }),
};
