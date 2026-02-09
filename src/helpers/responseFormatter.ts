export function toJson(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

export function paginatedResult<T>(
  items: T[],
  page: number,
  totalPages: number
): string {
  return JSON.stringify(
    {
      items,
      page,
      totalPages,
      count: items.length,
    },
    null,
    2
  );
}
