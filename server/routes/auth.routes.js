import { Router } from 'express';
import { validationResult } from 'express-validator';
import { loginValidators, registerValidators } from '../validators/auth.validators.js';

const router = Router();

function sendValidationErrors(req, res) {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return false;
  }

  res.status(400).json({
    message: 'Verifique os dados enviados.',
    errors: result.array().map(({ path, msg }) => ({ field: path, message: msg })),
  });
  return true;
}

router.post('/login', loginValidators, (req, res) => {
  if (sendValidationErrors(req, res)) {
    return;
  }

  return res.status(200).json({
    message: 'Dados validados.',
  });
});

router.post('/register', registerValidators, (req, res) => {
  if (sendValidationErrors(req, res)) {
    return;
  }

  return res.status(200).json({
    message: 'Dados validados com sucesso.',
  });
});

export default router;
