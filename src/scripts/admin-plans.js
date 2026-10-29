import { resourceApi } from './admin-api.js';
import { escapeHtml, openConfirm, openFormDialog } from './admin-dialog.js';

const plansApi = resourceApi('plans');
const usersApi = resourceApi('users');

const formatPrice = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Aceita "59,90" ou "59.90"; o servidor confere o intervalo e o formato.
const parsePrice = (text) => {
  const normalized = text.trim().replace(/\./g, (match, offset, all) => (all.includes(',') ? '' : match)).replace(',', '.');
  return normalized === '' ? NaN : Number(normalized);
};

/** Painel Planos: lista os planos ativos e permite adicionar, editar e remover. */
export function initPlans(container) {
  let plans = [];
  let users = [];

  container.innerHTML = `
    <div class="admin-toolbar">
      <p class="admin-toolbar__count" data-plans="count"></p>
      <button type="button" class="button button--primary admin-toolbar__add" data-plans="add" disabled>Adicionar plano</button>
    </div>
    <p class="admin-feedback" data-plans="feedback" role="status" hidden></p>
    <div data-plans="list"></div>
  `;

  const countEl = container.querySelector('[data-plans="count"]');
  const feedbackEl = container.querySelector('[data-plans="feedback"]');
  const listEl = container.querySelector('[data-plans="list"]');
  const addButton = container.querySelector('[data-plans="add"]');

  function feedback(message, isError = false) {
    feedbackEl.textContent = message;
    feedbackEl.hidden = !message;
    feedbackEl.classList.toggle('is-error', isError);
  }

  const usersIn = (planId) => users.filter((user) => user.plan === planId).length;

  function render() {
    countEl.textContent = `${plans.length} plano${plans.length === 1 ? '' : 's'} ativo${plans.length === 1 ? '' : 's'}`;

    if (plans.length === 0) {
      listEl.innerHTML = '<p class="admin-empty">Nenhum plano ativo.</p>';
      return;
    }

    const rows = plans.map((plan) => {
      const name = escapeHtml(plan.name);

      return `
        <tr>
          <td data-label="Plano">${name}<span class="admin-table__sub">${escapeHtml(plan.description)}</span></td>
          <td data-label="Preço">${formatPrice(plan.price)}/mês</td>
          <td data-label="Benefícios">${plan.features.length}</td>
          <td data-label="Nutrição">${escapeHtml(plan.nutricao)}</td>
          <td data-label="Psicologia">${escapeHtml(plan.psicologia)}</td>
          <td data-label="Usuários">${usersIn(plan.id)}</td>
          <td><div class="admin-table__actions">
            <button type="button" class="admin-action" data-action="edit" data-id="${escapeHtml(plan.id)}" aria-label="Editar ${name}">Editar</button>
            <button type="button" class="admin-action admin-action--danger" data-action="remove" data-id="${escapeHtml(plan.id)}" aria-label="Remover ${name}">Remover</button>
          </div></td>
        </tr>`;
    }).join('');

    listEl.innerHTML = `
      <table class="admin-table">
        <caption class="visually-hidden">Lista de planos ativos</caption>
        <thead>
          <tr>
            <th scope="col">Plano</th><th scope="col">Preço</th><th scope="col">Benefícios</th>
            <th scope="col">Nutrição</th><th scope="col">Psicologia</th><th scope="col">Usuários</th><th scope="col">Ações</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

  const formHtml = (plan = {}) => `
    <div class="admin-field">
      <label for="plan-name">Nome do plano</label>
      <input type="text" id="plan-name" name="name" maxlength="40" required placeholder="Vitta Start" value="${escapeHtml(plan.name)}">
    </div>
    <div class="admin-field">
      <label for="plan-price">Preço mensal (R$)</label>
      <input type="text" id="plan-price" name="price" inputmode="decimal" required placeholder="59,90" value="${plan.price === undefined ? '' : String(plan.price).replace('.', ',')}">
    </div>
    <div class="admin-field">
      <label for="plan-description">Descrição</label>
      <input type="text" id="plan-description" name="description" maxlength="120" required value="${escapeHtml(plan.description)}">
    </div>
    <div class="admin-field">
      <label for="plan-features">Modalidades e benefícios</label>
      <textarea id="plan-features" name="features" rows="6" required aria-describedby="plan-features-hint">${escapeHtml((plan.features ?? []).join('\n'))}</textarea>
      <p class="admin-field__hint" id="plan-features-hint">Um item por linha (de 1 a 12).</p>
    </div>
    <div class="admin-row">
      <div class="admin-field">
        <label for="plan-nutricao">Regra de Nutrição</label>
        <input type="text" id="plan-nutricao" name="nutricao" maxlength="40" required placeholder="2×/mês" value="${escapeHtml(plan.nutricao)}">
      </div>
      <div class="admin-field">
        <label for="plan-psicologia">Regra de Psicologia</label>
        <input type="text" id="plan-psicologia" name="psicologia" maxlength="40" required placeholder="X" value="${escapeHtml(plan.psicologia)}">
      </div>
    </div>`;

  const readForm = (form) => ({
    name: form.elements.name.value,
    price: parsePrice(form.elements.price.value),
    description: form.elements.description.value,
    features: form.elements.features.value.split('\n').map((line) => line.trim()).filter(Boolean),
    nutricao: form.elements.nutricao.value,
    psicologia: form.elements.psicologia.value,
  });

  let hasLoaded = false;
  let isLoading = false;

  async function load() {
    if (isLoading) return;
    isLoading = true;
    if (!hasLoaded) feedback('Carregando planos…');
    try {
      [plans, users] = await Promise.all([plansApi.list(), usersApi.list()]);
      if (!hasLoaded) feedback('');
      hasLoaded = true;
      addButton.disabled = false;
      render();
    } catch (error) {
      feedback(error.message, true);
    } finally {
      isLoading = false;
    }
  }

  addButton.addEventListener('click', async () => {
    const saved = await openFormDialog({
      title: 'Adicionar plano',
      bodyHtml: formHtml(),
      submitLabel: 'Adicionar',
      onSubmit: async (form) => {
        const created = await plansApi.create(readForm(form));
        plans = [...plans, created];
      },
    });

    if (saved) {
      render();
      feedback('Plano adicionado.');
    }
  });

  listEl.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;

    const plan = plans.find((item) => item.id === button.dataset.id);
    if (!plan) return;

    if (button.dataset.action === 'edit') {
      const saved = await openFormDialog({
        title: 'Editar plano',
        bodyHtml: formHtml(plan),
        onSubmit: async (form) => {
          const updated = await plansApi.update(plan.id, readForm(form));
          plans = plans.map((item) => (item.id === plan.id ? updated : item));
        },
      });

      if (saved) {
        render();
        feedback('Plano atualizado.');
      }
      return;
    }

    const removed = await openConfirm({
      title: 'Remover plano',
      message: `Deseja remover o plano ${plan.name}? Esta ação não pode ser desfeita.`,
      onConfirm: async () => {
        await plansApi.remove(plan.id);
        plans = plans.filter((item) => item.id !== plan.id);
      },
    });

    if (removed) {
      render();
      feedback('Plano removido.');
    }
  });

  load();

  // Recarrega ao voltar para o painel: planos e usuários dependem um do outro.
  return { reload: load };
}
