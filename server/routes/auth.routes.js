
import { Router } from 'express';
import { validationResult } from 'express-validator';
import { registerValidators } from '../validators/auth.validators.js';

const router = Router();

router.post('/register', registerValidators, (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Verifique os dados enviados.',
      errors: errors.array().map(({ path, msg }) => ({
        field: path,
        message: msg,
      })),
    });
  }

  // Por enquanto, somente validamos os dados.
  return res.status(200).json({
    message: 'Dados validados com sucesso.',
  });
});

export default router;