import { Router } from 'express';
import { validationResult } from 'express-validator';
import { registerValidators } from '../validators/auth.validators.js';

const router = Router();

router.post('/register', registerValidators, (req, res) => {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    return res.status(400).json({
      message: 'Verifique os dados enviados.',
      errors: result.array().map(({ path, msg }) => ({ field: path, message: msg })),
    });
  }
  return res.status(200).json({
    message: 'Dados validados com sucesso.',
  });
});

export default router;
