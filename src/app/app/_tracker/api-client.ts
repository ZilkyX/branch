import type { Application } from "./applications";

type ApplicationInput = Omit<Application, "id">;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
  return response.status === 204 ? (undefined as T) : response.json();
}

export function fetchApplications() {
  return request<Application[]>("/api/applications");
}

export function createApplication(input: ApplicationInput) {
  return request<Application>("/api/applications", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateApplication(id: string, patch: Partial<ApplicationInput>) {
  return request<Application>(`/api/applications/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function deleteApplication(id: string) {
  return request<void>(`/api/applications/${id}`, { method: "DELETE" });
}
