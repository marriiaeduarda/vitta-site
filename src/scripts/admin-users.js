import { resourceApi } from './admin-api.js';
import { escapeHtml, openConfirm, openFormDialog } from './admin-dialog.js';
import { ADMIN_EMAIL } from './session.js';

const usersApi = resourceApi('users');
const plansApi = resourceApi('plans');

/** Painel Usuários: lista, adiciona, edita e remove. A tela é redesenhada com o que a API devolve. */
export function initUsers(container) {
  let users = [];
  let plans = [];

  container.innerHTML = `
    <div class="admin-toolbar">
      <p class="admin-toolbar__count" data-users="count"></p>
      <button type="button" class="button button--primary admin-toolbar__add" data-users="add">Adicionar usuário</button>
    </div>
    <p class="admin-feedback" data-users="feedback" role="status" hidden></p>
    <div data-users="list"></div>
  `;

  const countEl = container.querySelector('[data-users="count"]');
  const feedbackEl = container.querySelector('[data-users="feedback"]');
  const listEl = container.querySelector('[data-users="list"]');
  const addButton = container.querySelector('[data-users="add"]');

  const planName = (id) => plans.find((plan) => plan.id === id)?.name ?? 'Sem plano';

  function feedback(message, isError = false) {
    feedbackEl.textContent = message;
    feedbackEl.hidden = !message;
    feedbackEl.classList.toggle('is-error', isError);
  }

  function render() {
    countEl.textContent = `${users.length} usuário${users.length === 1 ? '' : 's'}`;

    if (users.length === 0) {
      listEl.innerHTML = '<p class="admin-empty">Nenhum usuário cadastrado.</p>';
      return;
    }

    const rows = users.map((user) => {
      const isAdminUser = user.email === ADMIN_EMAIL;
      const name = escapeHtml(user.name);

      return `
        <tr>
          <td data-label="Nome">${name}</td>
          <td data-label="E-mail">${escapeHtml(user.email)}</td>
          <td data-label="Plano">${escapeHtml(planName(user.plan))}</td>
          <td><div class="admin-table__actions">
            <button type="button" class="admin-action" data-action="edit" data-id="${user.id}" aria-label="Editar ${name}">Editar</button>
            ${isAdminUser ? '' : `<button type="button" class="admin-action admin-action--danger" data-action="remove" data-id="${user.id}" aria-label="Remover ${name}">Remover</button>`}
          </div></td>
        </tr>`;
    }).join('');

    listEl.innerHTML = `
      <table class="admin-table">
        <caption class="visually-hidden">Lista de usuários</caption>
        <thead>
          <tr><th scope="col">Nome</th><th scope="col">E-mail</th><th scope="col">Plano</th><th scope="col">Ações</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

  function formHtml(user) {
    const isAdminUser = user?.email === ADMIN_EMAIL;
    const options = ['<option value="">Sem plano</option>']
      .concat(plans.map((plan) => `<option value="${escapeHtml(plan.id)}"${plan.id === user?.plan ? ' selected' : ''}>${escapeHtml(plan.name)}</option>`))
      .join('');

    return `
      <div class="admin-field">
        <label for="user-name">Nome</label>
        <input type="text" id="user-name" name="name" maxlength="100" required value="${escapeHtml(user?.name)}">
      </div>
      <div class="admin-field">
        <label for="user-email">E-mail</label>
        <input type="email" id="user-email" name="email" maxlength="120" required value="${escapeHtml(user?.email)}"${isAdminUser ? ' readonly aria-describedby="user-email-hint"' : ''}>
        ${isAdminUser ? '<p class="admin-field__hint" id="user-email-hint">O e-mail do administrador não pode ser alterado.</p>' : ''}
      </div>
      <div class="admin-field">
        <label for="user-plan">Plano</label>
        <select id="user-plan" name="plan">${options}</select>
      </div>`;
  }

  const readForm = (form) => ({
    name: form.elements.name.value,
    email: form.elements.email.value,
    plan: form.elements.plan.value || null,
  });

  let hasLoaded = false;
  let isLoading = false;

  async function load() {
    if (isLoading) return;
    isLoading = true;
    if (!hasLoaded) feedback('Carregando usuários…');
    try {
      [users, plans] = await Promise.all([usersApi.list(), plansApi.list()]);
      if (!hasLoaded) feedback('');
      hasLoaded = true;
      addButton.disabled = false;
      render();
    } catch (error) {
      addButton.disabled = true;
      feedback(error.message, true);
    } finally {
      isLoading = false;
    }
  }

  addButton.addEventListener('click', async () => {
    const saved = await openFormDialog({
      title: 'Adicionar usuário',
      bodyHtml: formHtml(null),
      submitLabel: 'Adicionar',
      onSubmit: async (form) => {
        const created = await usersApi.create(readForm(form));
        users = [...users, created];
      },
    });

    if (saved) {
      render();
      feedback('Usuário adicionado.');
    }
  });

  listEl.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;

    const user = users.find((item) => item.id === Number(button.dataset.id));
    if (!user) return;

    if (button.dataset.action === 'edit') {
      const saved = await openFormDialog({
        title: 'Editar usuário',
        bodyHtml: formHtml(user),
        onSubmit: async (form) => {
          const updated = await usersApi.update(user.id, readForm(form));
          users = users.map((item) => (item.id === user.id ? updated : item));
        },
      });

      if (saved) {
        render();
        feedback('Usuário atualizado.');
      }
      return;
    }

    const removed = await openConfirm({
      title: 'Remover usuário',
      message: `Deseja remover ${user.name} (${user.email})? Esta ação não pode ser desfeita.`,
      onConfirm: async () => {
        await usersApi.remove(user.id);
        users = users.filter((item) => item.id !== user.id);
      },
    });

    if (removed) {
      render();
      feedback('Usuário removido.');
    }
  });

  load();

  // Recarrega ao voltar para o painel: planos e usuários dependem um do outro.
  return { reload: load };
}
