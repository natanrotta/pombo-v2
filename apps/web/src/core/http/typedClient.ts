import { httpClient } from "./httpClient";

export function typedGet<T>(url: string): Promise<T> {
  return httpClient.get(url) as Promise<T>;
}

export function typedPost<T>(url: string, data?: unknown): Promise<T> {
  return httpClient.post(url, data) as Promise<T>;
}

export function typedPut<T>(url: string, data?: unknown): Promise<T> {
  return httpClient.put(url, data) as Promise<T>;
}

export function typedDelete(url: string): Promise<void> {
  return httpClient.delete(url) as Promise<void>;
}
