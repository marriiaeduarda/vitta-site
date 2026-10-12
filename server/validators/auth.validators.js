
import { body } from 'express-validator';

export const registerValidators = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('O nome é obrigatório.')
    .isLength({ max: 100 })
    .withMessage('O nome deve ter até 100 caracteres.'),

  body('email')
    .trim()
    .isEmail()
    .withMessage('Informe um e-mail válido.')
    .normalizeEmail(),

  body('password')
    .isString()
    .isLength({ min: 8, max: 72 })
    .withMessage('A senha deve ter entre 8 e 72 caracteres.'),

  body('passwordConfirm')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('As senhas não coincidem.');
      }
      return true;
    }),
];