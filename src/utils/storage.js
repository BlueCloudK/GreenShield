export function readStorage(key, fallback) {
  try {
    const rawValue = window.localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}
