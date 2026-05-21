"use client";

export const getCookie = (name: string): string | undefined =>
  document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];

export async function csrfFetch(url: string, options?: RequestInit): Promise<Response> {
  const csrf = getCookie("b2s_admin_csrf_token");
  const headers = new Headers(options?.headers ?? {});
  if (csrf) headers.set("x-csrf-token", csrf);
  return fetch(url, { ...options, headers });
}
