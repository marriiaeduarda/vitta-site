import { ApiError } from './admin-api.js';

/** Escapa texto antes de colocá-lo em HTML (nomes digitados pelo admin, por exemplo). */
export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const query = (name) => document.querySelector(`[data-admin="${name}"]`);

const formDialog = query('form-dialog');
const form = query('form');
const formTitle = query('form-title');
const formBody = query('form-body');
const formError = query('form-error');
const formSubmit = query('form-submit');

const confirmDialog = query('confirm-dialog');
const confirmTitle = query('confirm-title');
const confirmMessage = query('confirm-message');
const confirmError = query('confirm-error');
const confirmAccept = query('confirm-accept');

function showError(element, message) {
  element.textContent = message ?? '';
  element.hidden = !message;
}

function errorMessage(error) {
  return error instanceof ApiError ? error.message : 'Não foi possível concluir a ação. Tente novamente.';
}

/* ---------------------------------------------------------------- */
/* Modal de formulário                                                */
/* ---------------------------------------------------------------- */

let pendingForm = null;

/**
 * Abre o modal de formulário. `bodyHtml` traz os campos (use escapeHtml nos valores).
 * `onSubmit(formElement)` roda ao enviar; se lançar um ApiError, a mensagem aparece no
 * modal e ele continua aberto. Retorna uma Promise: true se salvou, false se cancelou.
 */
export function openFormDialog({ title, bodyHtml, submitLabel = 'Salvar', onSubmit }) {
  formTitle.textContent = title;
  formBody.innerHTML = bodyHtml;
  formSubmit.textContent = submitLabel;
  formSubmit.disabled = false;
  showError(formError, null);

  return new Promise((resolve) => {
    pendingForm = { resolve, onSubmit };
    formDialog.showModal();
  });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!pendingForm) return;

  showError(formError, null);
  formSubmit.disabled = true;

  try {
    await pendingForm.onSubmit(form);
    const { resolve } = pendingForm;
    pendingForm = null;
    formDialog.close();
    resolve(true);
  } catch (error) {
    showError(formError, errorMessage(error));
  } finally {
    formSubmit.disabled = false;
  }
});

query('form-cancel').addEventListener('click', () => formDialog.close());

// Fechar por Esc ou pelo botão Cancelar conta como "cancelou".
formDialog.addEventListener('close', () => {
  if (!pendingForm) return;
  pendingForm.resolve(false);
  pendingForm = null;
});

/* ---------------------------------------------------------------- */
/* Modal de confirmação                                               */
/* ---------------------------------------------------------------- */

let pendingConfirm = null;

/**
 * Pede confirmação antes de uma ação destrutiva. `onConfirm` (opcional) roda ao confirmar;
 * se lançar um ApiError (ex.: plano com usuários), a mensagem aparece no modal.
 * Retorna uma Promise: true se confirmou e deu certo, false se cancelou.
 */
export function openConfirm({ title, message, confirmLabel = 'Remover', onConfirm }) {
  confirmTitle.textContent = title;
  confirmMessage.textContent = message;
  confirmAccept.textContent = confirmLabel;
  confirmAccept.disabled = false;
  showError(confirmError, null);

  return new Promise((resolve) => {
    pendingConfirm = { resolve, onConfirm };
    confirmDialog.showModal();
  });
}

confirmAccept.addEventListener('click', async () => {
  if (!pendingConfirm) return;

  showError(confirmError, null);
  confirmAccept.disabled = true;

  try {
    await pendingConfirm.onConfirm?.();
    const { resolve } = pendingConfirm;
    pendingConfirm = null;
    confirmDialog.close();
    resolve(true);
  } catch (error) {
    showError(confirmError, errorMessage(error));
  } finally {
    confirmAccept.disabled = false;
  }
});

query('confirm-cancel').addEventListener('click', () => confirmDialog.close());

confirmDialog.addEventListener('close', () => {
  if (!pendingConfirm) return;
  pendingConfirm.resolve(false);
  pendingConfirm = null;
});
