import { Router } from 'express';
import { matchedData } from 'express-validator';
import { requireAdmin } from '../middleware/require-admin.js';
import { validateRequest } from '../middleware/validate-request.js';
import {
  adminPartnerValidators,
  numericIdParam,
  planIdParam,
  planValidators,
  userValidators,
} from '../validators/admin.validators.js';
import {
  ConflictError,
  NotFoundError,
  createPartner,
  createPlan,
  createUser,
  listPartners,
  listPlans,
  listUsers,
  removePartner,
  removePlan,
  removeUser,
  updatePartner,
  updatePlan,
  updateUser,
} from '../data/store.js';

const router = Router();

// Todas as rotas abaixo exigem o cabeçalho do administrador.
router.use(requireAdmin);

// Só os campos que passaram pelos validadores (já saneados) chegam ao store.
const validatedBody = (req) => matchedData(req, { locations: ['body'], includeOptionals: true });

/**
 * Converte os erros de regra de negócio do store em respostas HTTP:
 * conflito vira 409, item inexistente vira 404; o resto segue para o handler global.
 */
function respond(action) {
  return (req, res, next) => {
    try {
      action(req, res);
    } catch (error) {
      if (error instanceof ConflictError) {
        return res.status(409).json({ message: error.message });
      }

      if (error instanceof NotFoundError) {
        return res.status(404).json({ message: error.message });
      }

      return next(error);
    }
  };
}

/* ---------------------------------------------------------------- */
/* Usuários                                                           */
/* ---------------------------------------------------------------- */

router.get('/users', (_req, res) => {
  res.json({ items: listUsers() });
});

router.post('/users', userValidators, validateRequest, respond((req, res) => {
  const { name, email, plan } = validatedBody(req);
  res.status(201).json({ item: createUser({ name, email, plan: plan ?? null }) });
}));

router.put('/users/:id', [...numericIdParam, ...userValidators], validateRequest, respond((req, res) => {
  const { name, email, plan } = validatedBody(req);
  res.json({ item: updateUser(Number(req.params.id), { name, email, plan: plan ?? null }) });
}));

router.delete('/users/:id', numericIdParam, validateRequest, respond((req, res) => {
  removeUser(Number(req.params.id));
  res.json({ message: 'Usuário removido.' });
}));

/* ---------------------------------------------------------------- */
/* Parceiros                                                          */
/* ---------------------------------------------------------------- */

router.get('/partners', (_req, res) => {
  res.json({ items: listPartners() });
});

router.post('/partners', adminPartnerValidators, validateRequest, respond((req, res) => {
  res.status(201).json({ item: createPartner(validatedBody(req)) });
}));

router.put('/partners/:id', [...numericIdParam, ...adminPartnerValidators], validateRequest, respond((req, res) => {
  res.json({ item: updatePartner(Number(req.params.id), validatedBody(req)) });
}));

router.delete('/partners/:id', numericIdParam, validateRequest, respond((req, res) => {
  removePartner(Number(req.params.id));
  res.json({ message: 'Parceiro removido.' });
}));

/* ---------------------------------------------------------------- */
/* Planos                                                             */
/* ---------------------------------------------------------------- */

router.get('/plans', (_req, res) => {
  res.json({ items: listPlans() });
});

router.post('/plans', planValidators, validateRequest, respond((req, res) => {
  res.status(201).json({ item: createPlan(validatedBody(req)) });
}));

router.put('/plans/:id', [...planIdParam, ...planValidators], validateRequest, respond((req, res) => {
  res.json({ item: updatePlan(req.params.id, validatedBody(req)) });
}));

router.delete('/plans/:id', planIdParam, validateRequest, respond((req, res) => {
  removePlan(req.params.id);
  res.json({ message: 'Plano removido.' });
}));

export default router;
