/**
 * HTTP Client
 *
 * Centralized fetch wrapper for API calls.
 * Auth endpoints go through the Next.js same-origin proxy so auth cookies are
 * stored for the web origin. Other API requests go directly to NestJS.
 */

const envUrl = process.env.NEXT_PUBLIC_API_URL;
const API_BASE_URL = (envUrl && envUrl !== "undefined") ? envUrl : "http://127.0.0.1:3001/api/v1";

/** An HTTP error from the API; keeps the status and body for callers that branch on them. */
export class ApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly body: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    // Rely on Next.js rewrites for all API requests. This ensures Same-Origin for cookies.
    const url = `/api${endpoint}`;

    const response = await fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      let message = `API Error: ${response.status} ${response.statusText}`;
      let body: unknown;
      try {
        body = await response.json();
        const m = (body as { message?: unknown })?.message;
        if (m) {
          message = typeof m === "string" ? m : Array.isArray(m) ? String(m[0]) : message;
        }
      } catch {
        // Use the default message.
      }
      throw new ApiError(message, response.status, body);
    }

    return response.json() as Promise<T>;
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);