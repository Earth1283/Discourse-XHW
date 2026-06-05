// Client-side fetch helper. Unwraps { data } / throws { error.message }.
export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: init?.body ? { "content-type": "application/json" } : undefined,
    ...init,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.error?.message ?? `Request failed (${res.status})`);
  }
  return json.data as T;
}
