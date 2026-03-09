/**
 * API Helper
 * Makes authenticated requests to the Express backend
 * Automatically includes JWT token in Authorization header
 */

import { useAuth } from "@/lib/auth-context-supabase";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface RequestOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Get auth token for API requests
 */
async function getAuthToken(): Promise<string | null> {
  // This should be called within a context consumer
  // For standalone use, we can get it directly from Supabase
  try {
    const { supabase } = await import("@/lib/supabaseClient");
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  } catch {
    return null;
  }
}

/**
 * Make authenticated API request to backend
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  try {
    const method = options.method || "GET";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    // Add auth token
    const token = await getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const url = endpoint.startsWith("http")
      ? endpoint
      : `/api${endpoint.startsWith("/") ? endpoint : "/" + endpoint}`;

    const response = await fetch(url, {
      method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}`,
      };
    }

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error("API request error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * GET request helper
 */
export async function apiGet<T = any>(endpoint: string) {
  return apiRequest<T>(endpoint, { method: "GET" });
}

/**
 * POST request helper
 */
export async function apiPost<T = any>(endpoint: string, body: any) {
  return apiRequest<T>(endpoint, { method: "POST", body });
}

/**
 * PUT request helper
 */
export async function apiPut<T = any>(endpoint: string, body: any) {
  return apiRequest<T>(endpoint, { method: "PUT", body });
}

/**
 * DELETE request helper
 */
export async function apiDelete<T = any>(endpoint: string) {
  return apiRequest<T>(endpoint, { method: "DELETE" });
}

/**
 * Upload file to API
 */
export async function apiUploadFile(
  endpoint: string,
  file: File,
  additionalData?: Record<string, string>
): Promise<ApiResponse<any>> {
  try {
    const token = await getAuthToken();
    const formData = new FormData();
    formData.append("file", file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const url = endpoint.startsWith("http")
      ? endpoint
      : `/api${endpoint.startsWith("/") ? endpoint : "/" + endpoint}`;

    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}`,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("File upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}
