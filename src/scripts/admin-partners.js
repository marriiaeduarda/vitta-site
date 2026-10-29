import { resourceApi } from './admin-api.js';
import { escapeHtml, openConfirm, openFormDialog } from './admin-dialog.js';

const partnersApi = resourceApi('partners');

const CATEGORIES = {
  academia: 'Academia',
  pilates: 'Studio de Pilates',
  yoga: 'Studio de Yoga',
  danca: 'Estúdio de Dança',
  natacao: 'Club de Natação',
  lutas: 'Centro de Lutas',
  nutricao: 'Clínica de Nutrição',
  psicologia: 'Consultório de Psicologia',
  wellness: 'Espaço Wellness',
  esportivo: 'Centro Esportivo',
  outro: 'Outro',
};

const STATUSES = { pendente: 'Pendente', ativo: 'Ativo', inativo: 'Inativo' };

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO',
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

/* Máscaras simples (mesmo padrão do cadastro de parceiro) */
const digits = (value) => value.replace(/\D/g, '');

const maskCnpj = (value) => digits(value).slice(0, 14)
  .replace(/^(\d{2})(\d)/, '$1.$2')
  .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
  .replace(/\.(\d{3})(\d)/, '.$1/$2')
  .replace(/(\d{4})(\d)/, '$1-$2');

const maskCep = (value) => digits(value).slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2');

const maskPhone = (value) => {
  const numbers = digits(value).slice(0, 11);
  const base = numbers.replace(/^(\d{2})(\d)/, '($1) $2');
  return numbers.length <= 10 ? base.replace(/(\d{4})(\d)/, '$1-$2') : base.replace(/(\d{5})(\d)/, '$1-$2');
};

const MASKS = { cnpj: maskCnpj, cep: maskCep, telefone: maskPhone };

/** Painel Parceiros: lista, adiciona, edita e remove. */
export function initPartners(container) {
  let partners = [];

  container.innerHTML = `
    <div class="admin-toolbar">
      <p class="admin-toolbar__count" data-partners="count"></p>
      <button type="button" class="button button--primary admin-toolbar__add" data-partners="add" disabled>Adicionar parceiro</button>
    </div>
    <p class="admin-feedback" data-partners="feedback" role="status" hidden></p>
    <div data-partners="list"></div>
  `;

  const countEl = container.querySelector('[data-partners="count"]');
  const feedbackEl = container.querySelector('[data-partners="feedback"]');
  const listEl = container.querySelector('[data-partners="list"]');
  const addButton = container.querySelector('[data-partners="add"]');

  function feedback(message, isError = false) {
    feedbackEl.textContent = message;
    feedbackEl.hidden = !message;
    feedbackEl.classList.toggle('is-error', isError);
  }

  function render() {
    countEl.textContent = `${partners.length} parceiro${partners.length === 1 ? '' : 's'}`;

    if (partners.length === 0) {
      listEl.innerHTML = '<p class="admin-empty">Nenhum parceiro cadastrado.</p>';
      return;
    }

    const rows = partners.map((partner) => {
      const name = escapeHtml(partner.nomeEstabelecimento);

      return `
        <tr>
          <td data-label="Estabelecimento">${name}</td>
          <td data-label="CNPJ">${escapeHtml(partner.cnpj)}</td>
          <td data-label="Categoria">${escapeHtml(CATEGORIES[partner.categoria] ?? partner.categoria)}</td>
          <td data-label="Cidade">${escapeHtml(partner.cidade)}/${escapeHtml(partner.uf)}</td>
          <td data-label="Status"><span class="admin-badge admin-badge--${escapeHtml(partner.status)}">${escapeHtml(STATUSES[partner.status] ?? partner.status)}</span></td>
          <td><div class="admin-table__actions">
            <button type="button" class="admin-action" data-action="edit" data-id="${partner.id}" aria-label="Editar ${name}">Editar</button>
            <button type="button" class="admin-action admin-action--danger" data-action="remove" data-id="${partner.id}" aria-label="Remover ${name}">Remover</button>
          </div></td>
        </tr>`;
    }).join('');

    listEl.innerHTML = `
      <table class="admin-table">
        <caption class="visually-hidden">Lista de parceiros</caption>
        <thead>
          <tr>
            <th scope="col">Estabelecimento</th><th scope="col">CNPJ</th><th scope="col">Categoria</th>
            <th scope="col">Cidade</th><th scope="col">Status</th><th scope="col">Ações</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

  const textField = (id, label, value, { required = false, max = 150, type = 'text', placeholder = '', inputmode = '' } = {}) => `
    <div class="admin-field">
      <label for="partner-${id}">${label}</label>
      <input type="${type}" id="partner-${id}" name="${id}" maxlength="${max}"${required ? ' required' : ''}${placeholder ? ` placeholder="${placeholder}"` : ''}${inputmode ? ` inputmode="${inputmode}"` : ''} value="${escapeHtml(value)}">
    </div>`;

  const selectField = (id, label, options, selected) => `
    <div class="admin-field">
      <label for="partner-${id}">${label}</label>
      <select id="partner-${id}" name="${id}" required>
        ${options.map(([value, text]) => `<option value="${escapeHtml(value)}"${value === selected ? ' selected' : ''}>${escapeHtml(text)}</option>`).join('')}
      </select>
    </div>`;

  function formHtml(p = {}) {
    const chosen = p.modalidades ?? [];

    return `
      ${textField('nomeEstabelecimento', 'Nome do estabelecimento', p.nomeEstabelecimento, { required: true, max: 120 })}
      <div class="admin-row">
        ${textField('cnpj', 'CNPJ', p.cnpj, { required: true, max: 18, placeholder: '00.000.000/0000-00', inputmode: 'numeric' })}
        ${selectField('categoria', 'Categoria', [['', 'Selecione']].concat(Object.entries(CATEGORIES)), p.categoria ?? '')}
      </div>
      <div class="admin-field">
        <label for="partner-descricao">Descrição (opcional)</label>
        <textarea id="partner-descricao" name="descricao" rows="3" maxlength="200">${escapeHtml(p.descricao)}</textarea>
      </div>

      <div class="admin-row">
        ${textField('rua', 'Rua / avenida', p.rua, { required: true })}
        ${textField('numero', 'Número', p.numero, { required: true, max: 20 })}
      </div>
      <div class="admin-row">
        ${textField('complemento', 'Complemento (opcional)', p.complemento, { max: 80 })}
        ${textField('bairro', 'Bairro', p.bairro, { required: true, max: 80 })}
      </div>
      <div class="admin-row">
        ${textField('cep', 'CEP', p.cep, { required: true, max: 9, placeholder: '00000-000', inputmode: 'numeric' })}
        ${textField('cidade', 'Cidade', p.cidade, { required: true, max: 80 })}
      </div>
      ${selectField('uf', 'UF', [['', 'Selecione']].concat(UFS.map((uf) => [uf, uf])), p.uf ?? '')}

      <div class="admin-field">
        <fieldset>
          <legend>Modalidades</legend>
          <div class="admin-checks">
            ${MODALITIES.map((modality, index) => `
              <label class="admin-check" for="partner-mod-${index}">
                <input type="checkbox" id="partner-mod-${index}" name="modalidades" value="${escapeHtml(modality)}"${chosen.includes(modality) ? ' checked' : ''}>
                ${escapeHtml(modality)}
              </label>`).join('')}
          </div>
        </fieldset>
      </div>

      ${textField('responsavel', 'Nome do responsável', p.responsavel, { required: true, max: 120 })}
      <div class="admin-row">
        ${textField('telefone', 'Telefone', p.telefone, { required: true, max: 15, placeholder: '(11) 99999-9999', inputmode: 'numeric' })}
        ${textField('email', 'E-mail de contato', p.email, { required: true, max: 120, type: 'email' })}
      </div>
      <div class="admin-row">
        ${textField('site', 'Site (opcional)', p.site, { max: 200, placeholder: 'www.academia.com.br' })}
        ${textField('instagram', 'Instagram (opcional)', p.instagram, { max: 31, placeholder: '@academia' })}
      </div>
      ${selectField('status', 'Status', Object.entries(STATUSES), p.status ?? 'pendente')}`;
  }

  const readForm = (form) => {
    const value = (name) => form.elements[name].value;

    return {
      nomeEstabelecimento: value('nomeEstabelecimento'),
      cnpj: value('cnpj'),
      categoria: value('categoria'),
      descricao: value('descricao'),
      rua: value('rua'),
      numero: value('numero'),
      complemento: value('complemento'),
      bairro: value('bairro'),
      cep: value('cep'),
      cidade: value('cidade'),
      uf: value('uf'),
      modalidades: [...form.querySelectorAll('input[name="modalidades"]:checked')].map((input) => input.value),
      responsavel: value('responsavel'),
      telefone: value('telefone'),
      email: value('email'),
      site: value('site'),
      instagram: value('instagram'),
      status: value('status'),
    };
  };

  // Máscaras nos campos do modal (o corpo do formulário é recriado a cada abertura).
  document.querySelector('[data-admin="form-body"]').addEventListener('input', (event) => {
    const mask = MASKS[event.target.name];
    if (mask && event.target.id?.startsWith('partner-')) event.target.value = mask(event.target.value);
  });

  async function load() {
    feedback('Carregando parceiros…');
    try {
      partners = await partnersApi.list();
      feedback('');
      addButton.disabled = false;
      render();
    } catch (error) {
      feedback(error.message, true);
    }
  }

  addButton.addEventListener('click', async () => {
    const saved = await openFormDialog({
      title: 'Adicionar parceiro',
      bodyHtml: formHtml(),
      submitLabel: 'Adicionar',
      onSubmit: async (form) => {
        const created = await partnersApi.create(readForm(form));
        partners = [...partners, created];
      },
    });

    if (saved) {
      render();
      feedback('Parceiro adicionado.');
    }
  });

  listEl.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;

    const partner = partners.find((item) => item.id === Number(button.dataset.id));
    if (!partner) return;

    if (button.dataset.action === 'edit') {
      const saved = await openFormDialog({
        title: 'Editar parceiro',
        bodyHtml: formHtml(partner),
        onSubmit: async (form) => {
          const updated = await partnersApi.update(partner.id, readForm(form));
          partners = partners.map((item) => (item.id === partner.id ? updated : item));
        },
      });

      if (saved) {
        render();
        feedback('Parceiro atualizado.');
      }
      return;
    }

    const removed = await openConfirm({
      title: 'Remover parceiro',
      message: `Deseja remover ${partner.nomeEstabelecimento}? Esta ação não pode ser desfeita.`,
      onConfirm: async () => {
        await partnersApi.remove(partner.id);
        partners = partners.filter((item) => item.id !== partner.id);
      },
    });

    if (removed) {
      render();
      feedback('Parceiro removido.');
    }
  });

  load();
}
