import { AteraApiPageResponse } from "../types/atera.js";

const ATERA_BASE_URL = "https://app.atera.com/api/v3";

function getApiKey(): string {
  const key = process.env.ATERA_API_KEY;
  if (!key) {
    throw new Error("ATERA_API_KEY environment variable is not set");
  }
  return key;
}

export async function ateraGet<T>(
  path: string,
  params?: Record<string, string | number | undefined>
): Promise<T> {
  const url = new URL(`${ATERA_BASE_URL}${path}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "X-API-KEY": getApiKey(),
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Atera API error ${response.status} ${response.statusText}: ${body}`
    );
  }

  return (await response.json()) as T;
}

export async function ateraGetPaginated<T>(
  path: string,
  params?: Record<string, string | number | undefined>
): Promise<{ items: T[]; totalPages: number; page: number }> {
  const raw = await ateraGet<AteraApiPageResponse<T>>(path, params);
  return {
    items: raw.items ?? [],
    totalPages: raw.totalPages,
    page: raw.page,
  };
}
