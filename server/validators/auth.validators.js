import { body } from 'express-validator';

export const loginValidators = [
  body('email')
    .isString().withMessage('Informe um e-mail válido.')
    .bail()
    .trim()
    .notEmpty().withMessage('O e-mail é obrigatório.')
    .bail()
    .isEmail().withMessage('Digite um e-mail válido.')
    .normalizeEmail(),

  body('password')
    .isString().withMessage('Informe uma senha válida.')
    .bail()
    .notEmpty().withMessage('A senha é obrigatória.')
    .bail()
    .isLength({ max: 128 })
    .withMessage('A senha deve ter até 128 caracteres.'),
];

export const registerValidators = [
  body('name')
    .isString().withMessage('Informe um nome válido.')
    .bail()
    .trim()
    .notEmpty().withMessage('O nome é obrigatório.')
    .isLength({ max: 100 }).withMessage('O nome deve ter até 100 caracteres.'),

  body('email')
    .isString().withMessage('Informe um e-mail válido.')
    .bail()
    .trim()
    .isEmail().withMessage('Digite um e-mail válido.')
    .normalizeEmail(),

  body('password')
    .isString().withMessage('Informe uma senha válida.')
    .bail()
    .isLength({ min: 8, max: 128 })
    .withMessage('A senha deve ter entre 8 e 128 caracteres.'),

  body('passwordConfirm')
    .isString().withMessage('Confirme sua senha.')
    .bail()
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('As senhas não coincidem.');
      }
      return true;
    }),
];
