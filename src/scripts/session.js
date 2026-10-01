/**
 * Sessão simulada. Guarda {name, email, plan} no
 * localStorage para sobreviver à navegação entre páginas (Home,
 * Entrar, Assinatura, Minha Vitta).
 */

const STORAGE_KEY = 'vitta_session';

export function getSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function updateSession(partial) {
  const current = getSession() || {};
  setSession({ ...current, ...partial });
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export function isLoggedIn() {
  return getSession() !== null;
}