import { body, param } from 'express-validator';
import { hasPlan } from '../data/store.js';
import { partnerDataValidators } from './partner.validators.js';

export const PARTNER_STATUSES = ['pendente', 'ativo', 'inativo'];

// As mensagens citam o campo entre aspas para funcionar com qualquer gênero de palavra.
const requiredText = (field, label, max) =>
  body(field)
    .isString().withMessage(`O campo "${label}" deve ser um texto válido.`)
    .bail()
    .trim()
    .notEmpty().withMessage(`Preencha o campo "${label}".`)
    .isLength({ max }).withMessage(`O campo "${label}" deve ter até ${max} caracteres.`);

/* ---------------------------------------------------------------- */
/* Identificadores na URL                                             */
/* ---------------------------------------------------------------- */

export const numericIdParam = [
  param('id').isInt({ min: 1 }).withMessage('Identificador inválido.'),
];

export const planIdParam = [
  param('id').matches(/^[a-z0-9-]{1,60}$/).withMessage('Identificador inválido.'),
];

/* ---------------------------------------------------------------- */
/* Usuários                                                           */
/* ---------------------------------------------------------------- */

export const userValidators = [
  requiredText('name', 'Nome', 100),

  body('email')
    .isString().withMessage('Informe um e-mail válido.')
    .bail()
    .trim()
    .isLength({ max: 120 }).withMessage('O e-mail deve ter até 120 caracteres.')
    .bail()
    .isEmail().withMessage('Digite um e-mail válido.')
    .bail()
    .toLowerCase(),

  // Vazio ou nulo significa "sem plano".
  body('plan')
    .optional({ values: 'falsy' })
    .isString().withMessage('Selecione um plano válido.')
    .bail()
    .custom(hasPlan).withMessage('Selecione um plano válido.'),
];

/* ---------------------------------------------------------------- */
/* Parceiros                                                          */
/* ---------------------------------------------------------------- */

export const adminPartnerValidators = [
  ...partnerDataValidators,

  body('status')
    .isString().withMessage('Selecione um status válido.')
    .bail()
    .isIn(PARTNER_STATUSES).withMessage('Selecione um status válido.'),
];

/* ---------------------------------------------------------------- */
/* Planos                                                             */
/* ---------------------------------------------------------------- */

export const planValidators = [
  requiredText('name', 'Nome do plano', 40),

  body('price')
    .isFloat({ min: 0.01, max: 99999 }).withMessage('Informe um preço entre R$0,01 e R$99.999,00.')
    .bail()
    .toFloat()
    .customSanitizer((value) => Math.round(value * 100) / 100),

  requiredText('description', 'Descrição', 120),

  body('features')
    .isArray({ min: 1, max: 12 }).withMessage('Informe de 1 a 12 modalidades ou benefícios.'),
  body('features.*')
    .isString().withMessage('Um benefício informado é inválido.')
    .bail()
    .trim()
    .notEmpty().withMessage('Um benefício informado está vazio.')
    .isLength({ max: 60 }).withMessage('Cada benefício deve ter até 60 caracteres.'),

  requiredText('nutricao', 'Regra de Nutrição', 40),
  requiredText('psicologia', 'Regra de Psicologia', 40),
];
