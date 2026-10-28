import { Router } from 'express';
import { matchedData, validationResult } from 'express-validator';
import {
  partnerRegistrationValidators,
  partnerStepValidators,
} from '../validators/partner.validators.js';
import { ConflictError, createPartner } from '../data/store.js';

const router = Router();

// Valida somente os campos pertencentes à etapa solicitada.
router.post('/validate-step', async (req, res, next) => {
  const step = Number(req.body?.step);
  const validators = partnerStepValidators[step];

  if (!validators) {
    return res.status(400).json({
      message: 'Etapa do formulário inválida.',
    });
  }

  try {
    await Promise.all(validators.map((validator) => validator.run(req)));
    const result = validationResult(req);

    if (!result.isEmpty()) {
      return res.status(400).json({
        message: 'Revise os dados desta etapa.',
        errors: result.array().map(({ path, msg }) => ({ field: path, message: msg })),
      });
    }

    return res.status(200).json({
      message: 'Etapa validada com sucesso.',
      step,
    });
  } catch (error) {
    return next(error);
  }
});

// Validação completa no envio final, mesmo que o cliente contorne as etapas.
router.post('/register', partnerRegistrationValidators, (req, res, next) => {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    return res.status(400).json({
      message: 'Revise os dados do cadastro de parceiro.',
      errors: result.array().map(({ path, msg }) => ({ field: path, message: msg })),
    });
  }

  // O cadastro entra no painel administrativo como "pendente" (armazenamento em memória).
  const { aceiteTermos, ...data } = matchedData(req, { locations: ['body'], includeOptionals: true });

  try {
    createPartner({ ...data, status: 'pendente' });
  } catch (error) {
    if (error instanceof ConflictError) {
      return res.status(409).json({ message: error.message });
    }
    return next(error);
  }

  return res.status(200).json({
    message: 'Cadastro de parceiro recebido com sucesso.',
  });
});

export default router;
