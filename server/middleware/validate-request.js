import { validationResult } from 'express-validator';

/**
 * Responde 400 com a lista de erros no mesmo formato usado pelas demais rotas
 * ({ message, errors: [{ field, message }] }) quando algum validador falhou.
 */
export function validateRequest(req, res, next) {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  return res.status(400).json({
    message: 'Verifique os dados enviados.',
    errors: result.array().map(({ path, msg }) => ({ field: path, message: msg })),
  });
}
