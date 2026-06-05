// Client-side fetch helper. Unwraps { data } / throws { error.message }.
// FormData bodies must NOT have a content-type set — the browser adds the multipart boundary.
export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const isForm = init?.body instanceof FormData;
  const res = await fetch(url, {
    headers: init?.body && !isForm ? { "content-type": "application/json" } : undefined,
    ...init,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.error?.message ?? `Request failed (${res.status})`);
  }
  return json.data as T;
}
