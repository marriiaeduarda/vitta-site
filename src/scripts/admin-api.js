import { getSession, clearSession } from './session.js';

/** Erro devolvido pela API (ou falha de conexão), com mensagem pronta para exibir. */
export class ApiError extends Error {
  constructor(message, { status = 0, fieldErrors = [] } = {}) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

function messageFrom(data) {
  return data?.errors?.map((error) => error.message).join(' ')
    || data?.message
    || 'Não foi possível concluir a ação. Tente novamente.';
}

/**
 * Chamada à API administrativa. Envia o e-mail da sessão em X-Admin-Email
 * (guarda simulada, veja server/middleware/require-admin.js).
 */
export async function adminRequest(path, { method = 'GET', body } = {}) {
  const session = getSession();
  let response;

  try {
    response = await fetch(`/api/admin${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Email': session?.email ?? '',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Não foi possível conectar ao servidor. Tente novamente.');
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Resposta sem corpo JSON: segue com a mensagem padrão.
  }

  if (response.status === 403) {
    // Sessão sem permissão de administrador: encerra e volta para a Home.
    clearSession();
    window.location.replace('home.html');
    throw new ApiError(messageFrom(data), { status: 403 });
  }

  if (!response.ok) {
    throw new ApiError(messageFrom(data), { status: response.status, fieldErrors: data?.errors ?? [] });
  }

  return data;
}

/** Atalhos de CRUD para um recurso: 'users', 'partners' ou 'plans'. */
export function resourceApi(resource) {
  return {
    list: async () => (await adminRequest(`/${resource}`)).items,
    create: async (payload) => (await adminRequest(`/${resource}`, { method: 'POST', body: payload })).item,
    update: async (id, payload) => (await adminRequest(`/${resource}/${id}`, { method: 'PUT', body: payload })).item,
    remove: async (id) => { await adminRequest(`/${resource}/${id}`, { method: 'DELETE' }); },
  };
}
