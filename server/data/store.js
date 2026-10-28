/**
 * Armazenamento em memória usado pelo painel administrativo.
 *
 * Os dados nascem desta lista simulada,
 * mudam conforme as ações do admin e voltam ao estado inicial quando o servidor
 * reinicia.
 */

export const ADMIN_EMAIL = 'admin@vitta.com';

export class ConflictError extends Error {}
export class NotFoundError extends Error {}

const clone = (value) => structuredClone(value);

/* ---------------------------------------------------------------- */
/* Planos                                                             */
/* ---------------------------------------------------------------- */

const plans = [
  {
    id: 'start',
    name: 'Vitta Start',
    price: 59.9,
    description: 'O primeiro passo para uma vida em movimento',
    features: ['Musculação', 'Funcional', 'Corrida e Caminhada', 'Hidroginástica', 'Ciclismo Indoor'],
    nutricao: 'X',
    psicologia: 'X',
  },
  {
    id: 'move',
    name: 'Vitta Move',
    price: 89.9,
    description: 'Para quem quer adrenalina e desafio',
    features: ['Tudo do START', 'Boxe', 'Muay Thai', 'Jiu-jitsu', 'Judô', 'Karatê'],
    nutricao: '1×/mês',
    psicologia: 'X',
  },
  {
    id: 'plus',
    name: 'Vitta Plus',
    price: 119.9,
    description: 'Equilíbrio entre corpo, mente e movimento',
    features: ['Tudo do MOVE', 'Yoga', 'Pilates', 'Dança', 'Zumba', 'Pole Dance'],
    nutricao: '2×/mês',
    psicologia: '1×/mês',
  },
  {
    id: 'black',
    name: 'Vitta Black',
    price: 159.9,
    description: 'Liberdade para cuidar de você do seu jeito',
    features: ['Tudo do PLUS', 'Natação', 'Beach Tennis', 'Vôlei de Praia', 'Futevôlei', 'Spinning'],
    nutricao: 'Ilimitada',
    psicologia: '2×/mês',
  },
  {
    id: 'elite',
    name: 'Vitta Elite',
    price: 229.9,
    description: 'A experiência mais completa em bem-estar',
    features: ['Tudo do BLACK', 'Surf', 'Stand Up Paddle', 'Trekking', 'Esportes Radicais', 'Aulas Particulares'],
    nutricao: 'Ilimitada + personalizada',
    psicologia: 'Ilimitada',
  },
];

function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function listPlans() {
  return clone(plans);
}

export function hasPlan(id) {
  return plans.some((plan) => plan.id === id);
}

export function createPlan(data) {
  const id = slugify(data.name);

  if (!id) {
    throw new ConflictError('Informe um nome válido para o plano.');
  }

  if (hasPlan(id)) {
    throw new ConflictError('Já existe um plano com este nome.');
  }

  const plan = { id, ...data };
  plans.push(plan);
  return clone(plan);
}

export function updatePlan(id, data) {
  const index = plans.findIndex((plan) => plan.id === id);

  if (index === -1) {
    throw new NotFoundError('Plano não encontrado.');
  }

  const nameInUse = plans.some((plan) => plan.id !== id && slugify(plan.name) === slugify(data.name));
  if (nameInUse) {
    throw new ConflictError('Já existe um plano com este nome.');
  }

  // O id (usado nos links e na sessão dos usuários) nunca muda.
  plans[index] = { id, ...data };
  return clone(plans[index]);
}

export function removePlan(id) {
  const index = plans.findIndex((plan) => plan.id === id);

  if (index === -1) {
    throw new NotFoundError('Plano não encontrado.');
  }

  const usersInPlan = users.filter((user) => user.plan === id).length;
  if (usersInPlan > 0) {
    throw new ConflictError(
      `Este plano possui ${usersInPlan} usuário${usersInPlan === 1 ? '' : 's'}. Mude o plano deles antes de remover.`
    );
  }

  plans.splice(index, 1);
}

/* ---------------------------------------------------------------- */
/* Usuários                                                           */
/* ---------------------------------------------------------------- */

const users = [
  { id: 1, name: 'Administrador', email: ADMIN_EMAIL, plan: null },
  { id: 2, name: 'Mariana Alves', email: 'mariana.alves@email.com', plan: 'black' },
  { id: 3, name: 'Rafael Costa', email: 'rafael.costa@email.com', plan: 'move' },
  { id: 4, name: 'Beatriz Nunes', email: 'beatriz.nunes@email.com', plan: 'plus' },
  { id: 5, name: 'Lucas Ferreira', email: 'lucas.ferreira@email.com', plan: 'start' },
  { id: 6, name: 'Camila Rocha', email: 'camila.rocha@email.com', plan: 'elite' },
];

let nextUserId = users.length + 1;

const emailInUse = (email, ignoreId) =>
  users.some((user) => user.id !== ignoreId && user.email.toLowerCase() === email.toLowerCase());

export function listUsers() {
  return clone(users);
}

export function createUser(data) {
  if (emailInUse(data.email)) {
    throw new ConflictError('Já existe um usuário com este e-mail.');
  }

  const user = { id: nextUserId++, ...data };
  users.push(user);
  return clone(user);
}

export function updateUser(id, data) {
  const index = users.findIndex((user) => user.id === id);

  if (index === -1) {
    throw new NotFoundError('Usuário não encontrado.');
  }

  if (users[index].email === ADMIN_EMAIL && data.email.toLowerCase() !== ADMIN_EMAIL) {
    throw new ConflictError('O e-mail do administrador não pode ser alterado.');
  }

  if (emailInUse(data.email, id)) {
    throw new ConflictError('Já existe um usuário com este e-mail.');
  }

  users[index] = { id, ...data };
  return clone(users[index]);
}

export function removeUser(id) {
  const index = users.findIndex((user) => user.id === id);

  if (index === -1) {
    throw new NotFoundError('Usuário não encontrado.');
  }

  if (users[index].email === ADMIN_EMAIL) {
    throw new ConflictError('O usuário administrador não pode ser removido.');
  }

  users.splice(index, 1);
}

/* ---------------------------------------------------------------- */
/* Parceiros                                                          */
/* ---------------------------------------------------------------- */

const partners = [
  {
    id: 1, status: 'ativo', nomeEstabelecimento: 'Academia Force', cnpj: '11.222.333/0001-81',
    categoria: 'academia', descricao: 'Academia completa com foco em musculação e funcional.',
    rua: 'Rua das Flores', numero: '42', complemento: '', bairro: 'Centro', cep: '06401-000',
    cidade: 'Barueri', uf: 'SP', modalidades: ['Musculação', 'Funcional'],
    responsavel: 'João da Silva', telefone: '(11) 99999-1111', email: 'contato@academiaforce.com.br',
    site: 'www.academiaforce.com.br', instagram: '@academiaforce',
  },
  {
    id: 2, status: 'ativo', nomeEstabelecimento: 'Studio Pilates Prime', cnpj: '44.555.666/0001-81',
    categoria: 'pilates', descricao: '',
    rua: 'Av. Paulista', numero: '1500', complemento: 'Sala 12', bairro: 'Bela Vista', cep: '01310-100',
    cidade: 'São Paulo', uf: 'SP', modalidades: ['Pilates', 'Yoga'],
    responsavel: 'Marina Duarte', telefone: '(11) 98888-2222', email: 'oi@pilatesprime.com.br',
    site: '', instagram: '@pilatesprime',
  },
  {
    id: 3, status: 'pendente', nomeEstabelecimento: 'CrossFit Zona Sul', cnpj: '77.888.999/0001-81',
    categoria: 'academia', descricao: 'Box de CrossFit com aulas em grupo.',
    rua: 'Rua Consolação', numero: '220', complemento: '', bairro: 'Consolação', cep: '01301-000',
    cidade: 'São Paulo', uf: 'SP', modalidades: ['CrossFit', 'Funcional'],
    responsavel: 'Pedro Lima', telefone: '(11) 97777-3333', email: 'box@crossfitzonasul.com.br',
    site: '', instagram: '',
  },
  {
    id: 4, status: 'ativo', nomeEstabelecimento: 'Arte Suave BJJ', cnpj: '12.345.678/0001-95',
    categoria: 'lutas', descricao: '',
    rua: 'Av. Brasil', numero: '800', complemento: '', bairro: 'Jardim América', cep: '06020-000',
    cidade: 'Osasco', uf: 'SP', modalidades: ['Jiu-jitsu', 'Judô'],
    responsavel: 'Carlos Mendes', telefone: '(11) 96666-4444', email: 'contato@artesuave.com.br',
    site: '', instagram: '@artesuavebjj',
  },
  {
    id: 5, status: 'inativo', nomeEstabelecimento: 'Zen Yoga Center', cnpj: '23.456.789/0001-95',
    categoria: 'yoga', descricao: 'Espaço de yoga e meditação.',
    rua: 'Rua da Paz', numero: '15', complemento: '', bairro: 'Vila Nova', cep: '06150-000',
    cidade: 'Osasco', uf: 'SP', modalidades: ['Yoga'],
    responsavel: 'Helena Prado', telefone: '(11) 95555-5555', email: 'ola@zenyoga.com.br',
    site: '', instagram: '',
  },
];

let nextPartnerId = partners.length + 1;

const onlyDigits = (value) => String(value ?? '').replace(/\D/g, '');

const cnpjInUse = (cnpj, ignoreId) =>
  partners.some((partner) => partner.id !== ignoreId && onlyDigits(partner.cnpj) === onlyDigits(cnpj));

// Guarda sempre no formato 00.000.000/0000-00, qualquer que seja o formato enviado.
function formatCnpj(value) {
  return onlyDigits(value).replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

function formatCep(value) {
  return onlyDigits(value).replace(/^(\d{5})(\d{3})$/, '$1-$2');
}

function normalizePartner(data) {
  return {
    ...data,
    cnpj: formatCnpj(data.cnpj),
    cep: formatCep(data.cep),
    descricao: data.descricao ?? '',
    complemento: data.complemento ?? '',
    site: data.site ?? '',
    instagram: data.instagram ?? '',
  };
}

export function listPartners() {
  return clone(partners);
}

export function createPartner(data) {
  const partner = normalizePartner(data);

  if (cnpjInUse(partner.cnpj)) {
    throw new ConflictError('Já existe um parceiro com este CNPJ.');
  }

  const created = { id: nextPartnerId++, ...partner };
  partners.push(created);
  return clone(created);
}

export function updatePartner(id, data) {
  const index = partners.findIndex((partner) => partner.id === id);

  if (index === -1) {
    throw new NotFoundError('Parceiro não encontrado.');
  }

  const partner = normalizePartner(data);

  if (cnpjInUse(partner.cnpj, id)) {
    throw new ConflictError('Já existe um parceiro com este CNPJ.');
  }

  partners[index] = { id, ...partner };
  return clone(partners[index]);
}

export function removePartner(id) {
  const index = partners.findIndex((partner) => partner.id === id);

  if (index === -1) {
    throw new NotFoundError('Parceiro não encontrado.');
  }

  partners.splice(index, 1);
}
