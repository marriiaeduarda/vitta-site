import { body } from 'express-validator';

const CATEGORIES = [
  'academia', 'pilates', 'yoga', 'danca', 'natacao', 'lutas',
  'nutricao', 'psicologia', 'wellness', 'esportivo', 'outro',
];

const MODALITIES = [
  'Musculação', 'Funcional', 'Corrida e Caminhada', 'Hidroginástica',
  'Ciclismo Indoor', 'Boxe', 'Muay Thai', 'Jiu-jitsu', 'Judô', 'Karatê',
  'Taekwondo', 'Kickboxing', 'Yoga', 'Pilates', 'Dança', 'Zumba',
  'Pole Dance', 'Ballet', 'Ritmos', 'Natação', 'Beach Tennis',
  'Vôlei de Praia', 'Futevôlei', 'Spinning', 'CrossFit', 'Escalada Indoor',
  'Surf', 'Stand Up Paddle', 'Trekking', 'Esportes Radicais', 'Nutrição',
  'Psicologia',
];

const BRAZIL_UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO',
];

function digitsOnly(value) {
  return String(value ?? '').replace(/\D/g, '');
}

function isValidCnpj(value) {
  const cnpj = digitsOnly(value);
  if (cnpj.length !== 14 || /^([0-9])\1{13}$/.test(cnpj)) return false;

  const calculateDigit = (base, weights) => {
    const sum = weights.reduce((total, weight, index) => total + Number(base[index]) * weight, 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstDigit = calculateDigit(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const secondDigit = calculateDigit(cnpj.slice(0, 12) + firstDigit, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return cnpj.endsWith(`${firstDigit}${secondDigit}`);
}

const requiredText = (field, label, max = 120) =>
  body(field)
    .isString().withMessage(`${label} deve ser um texto válido.`)
    .bail()
    .trim()
    .notEmpty().withMessage(`${label} é obrigatório.`)
    .isLength({ max }).withMessage(`${label} deve ter até ${max} caracteres.`);

const step1Validators = [requiredText('nomeEstabelecimento', 'Nome do estabelecimento', 120),
  body('cnpj')
    .isString().withMessage('Informe um CNPJ válido.')
    .bail()
    .custom(isValidCnpj).withMessage('Informe um CNPJ válido.'),
  body('categoria')
    .isString().withMessage('Selecione uma categoria válida.')
    .bail()
    .isIn(CATEGORIES).withMessage('Selecione uma categoria válida.'),
  body('descricao')
    .optional({ checkFalsy: true })
    .isString().withMessage('A descrição deve ser um texto.')
    .bail()
    .trim()
    .isLength({ max: 200 }).withMessage('A descrição deve ter até 200 caracteres.'),
];

const step2Validators = [requiredText('rua', 'Rua / avenida', 150),
  requiredText('numero', 'Número', 20),
  body('complemento')
    .optional({ checkFalsy: true })
    .isString().withMessage('O complemento deve ser um texto.')
    .bail()
    .trim()
    .isLength({ max: 100 }).withMessage('O complemento deve ter até 100 caracteres.'),
  requiredText('bairro', 'Bairro', 100),
  body('cep')
    .isString().withMessage('Informe um CEP válido.')
    .bail()
    .custom((value) => /^\d{5}-?\d{3}$/.test(value.trim()))
    .withMessage('Informe um CEP válido.'),
  requiredText('cidade', 'Cidade', 100),
  body('uf')
    .isString().withMessage('Selecione uma UF válida.')
    .bail()
    .isIn(BRAZIL_UFS).withMessage('Selecione uma UF válida.'),
];

const step3Validators = [body('modalidades')
    .isArray({ min: 1 }).withMessage('Selecione ao menos uma modalidade.'),
  body('modalidades.*')
    .isString().withMessage('Uma modalidade informada é inválida.')
    .bail()
    .isIn(MODALITIES).withMessage('Uma modalidade informada é inválida.'),
];

const contactValidators = [requiredText('responsavel', 'Nome do responsável', 120),
  body('telefone')
    .isString().withMessage('Informe um telefone válido.')
    .bail()
    .custom((value) => [10, 11].includes(digitsOnly(value).length))
    .withMessage('Informe um telefone com DDD válido.'),
  body('email')
    .isString().withMessage('Informe um e-mail válido.')
    .bail()
    .trim()
    .isEmail().withMessage('Informe um e-mail válido.')
    .normalizeEmail(),
  body('site')
    .optional({ checkFalsy: true })
    .isString().withMessage('Informe um site válido.')
    .bail()
    .trim()
    .isLength({ max: 200 }).withMessage('O site deve ter até 200 caracteres.')
    .bail()
    .custom((value) => {
      const normalized = /^https?:\/\//i.test(value) ? value : `https://${value}`;
      try {
        const url = new URL(normalized);
        return Boolean(url.hostname.includes('.') && !url.username && !url.password);
      } catch {
        return false;
      }
    }).withMessage('Informe um endereço de site válido.'),
  body('instagram')
    .optional({ checkFalsy: true })
    .isString().withMessage('Informe um usuário do Instagram válido.')
    .bail()
    .trim()
    .matches(/^@?[A-Za-z0-9._]{1,30}$/)
    .withMessage('Informe apenas o usuário do Instagram, por exemplo @academia.'),
];

const termsValidator = body('aceiteTermos')
  .custom((value) => value === true)
  .withMessage('É necessário aceitar os termos de parceria.');

const step4Validators = [...contactValidators, termsValidator];

export const partnerStepValidators = {
  1: step1Validators,
  2: step2Validators,
  3: step3Validators,
  4: step4Validators,
};

// Mantém a validação completa para o envio final do cadastro.
export const partnerRegistrationValidators = [
  ...step1Validators,
  ...step2Validators,
  ...step3Validators,
  ...step4Validators,
];

// Dados do parceiro sem o aceite de termos: usados pelo painel administrativo,
// onde quem cadastra é a equipe VITTA e não o próprio estabelecimento.
export const partnerDataValidators = [
  ...step1Validators,
  ...step2Validators,
  ...step3Validators,
  ...contactValidators,
];

export { digitsOnly, CATEGORIES, BRAZIL_UFS, MODALITIES };
