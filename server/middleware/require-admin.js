import { ADMIN_EMAIL } from '../data/store.js';

/**
 * Guarda das rotas administrativas (SIMULADA).
 *
 * O login do projeto não tem senha nem token: qualquer e-mail é aceito e a
 * sessão fica no navegador. Por isso o front envia o e-mail da sessão no
 * cabeçalho X-Admin-Email e o servidor apenas confere se é o do administrador.
 * Isso esconde a área de quem usa o site normalmente.
 */
export function requireAdmin(req, res, next) {
  const email = String(req.get('x-admin-email') ?? '').trim().toLowerCase();

  if (email !== ADMIN_EMAIL) {
    return res.status(403).json({ message: 'Acesso restrito ao administrador.' });
  }

  return next();
}
