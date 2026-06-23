/**
 * HTTP Interceptors
 *
 * Auth is now handled via HTTP-only cookies (credentials: "include").
 * No manual token injection is needed on the frontend.
 */

export function getAuthHeaders(): Record<string, string> {
  // Cookies are sent automatically via credentials: "include" on the ApiClient.
  // This function is kept for backward compatibility but returns empty headers.
  return {};
}

export function handleApiError(error: unknown): never {
  // TODO: Integrate with error reporting service (e.g., Sentry)
  console.error("[API Error]", error);
  throw error;
}
