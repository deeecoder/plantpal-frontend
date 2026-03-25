// src/services/api.js
// All HTTP calls to the Spring Boot backend

const BASE_URL = "https://plantpal-backend-27z7.onrender.com/api";

// ─── Helper ──────────────────────────────────────────────────
function getToken() {
  return localStorage.getItem("plantpal_token");
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Request failed: ${res.status}`);
  }

  // 204 No Content
  if (res.status === 204) return null;
  return res.json();
}

// ─── Auth ─────────────────────────────────────────────────────
export const authApi = {
  register: (name, email, password) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),

  login: (email, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
};

// ─── Plants ───────────────────────────────────────────────────
export const plantsApi = {
  getAll: () => request("/plants"),

  getOne: (id) => request(`/plants/${id}`),

  create: (plant) =>
    request("/plants", {
      method: "POST",
      body: JSON.stringify(plant),
    }),

  update: (id, plant) =>
    request(`/plants/${id}`, {
      method: "PUT",
      body: JSON.stringify(plant),
    }),

  delete: (id) =>
    request(`/plants/${id}`, { method: "DELETE" }),

  getDashboard: () => request("/plants/dashboard"),
};

// ─── Watering ─────────────────────────────────────────────────
export const wateringApi = {
  logWatering: (plantId, notes = "") =>
    request(`/plants/${plantId}/water`, {
      method: "POST",
      body: JSON.stringify({ notes }),
    }),

  getLogs: (plantId) => request(`/plants/${plantId}/water`),
};

// ─── Progress ─────────────────────────────────────────────────
export const progressApi = {
  logProgress: (plantId, heightCm, healthStatus, notes) =>
    request(`/plants/${plantId}/progress`, {
      method: "POST",
      body: JSON.stringify({ heightCm, healthStatus, notes }),
    }),

  getLogs: (plantId) => request(`/plants/${plantId}/progress`),
};
