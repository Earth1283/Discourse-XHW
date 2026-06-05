"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Session } from "@/lib/auth/session";

export function useSession() {
  const { data } = useQuery({
    queryKey: ["session"],
    queryFn: () => apiFetch<Session | null>("/api/auth/me"),
    staleTime: 60_000,
  });
  return data ?? null;
}
