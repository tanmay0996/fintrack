const BASE_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL;

const getToken = () => localStorage.getItem("accessToken");

const apiFetch = async (path, options = {}) => {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
};

export const api = {
  get: (path, params) => {
    const url = params
      ? `${path}?${new URLSearchParams(params).toString()}`
      : path;
    return apiFetch(url, { method: "GET" });
  },
  post: (path, body) =>
    apiFetch(path, { method: "POST", body: JSON.stringify(body) }),
  patch: (path, body) =>
    apiFetch(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (path) => apiFetch(path, { method: "DELETE" }),
};
