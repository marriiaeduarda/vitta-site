import { setSession } from './session.js';

const forms = document.querySelectorAll('[data-auth-form]');
const loginForm = document.querySelector('[data-auth="login-form"]');
const registerForm = document.querySelector('[data-auth="register-form"]');
const loginError = document.querySelector('[data-auth="login-error"]');
const registerError = document.querySelector('[data-auth="register-error"]');

// Plano pretendido, se a pessoa veio de um link "Escolher X" sem estar logada.
const planoParam = new URLSearchParams(window.location.search).get('plano');

/**
 * Mostra o formulário de login ou cadastro, escondendo o outro, e mantém
 * o modo atual refletido na URL (?modo=cadastro), para que outros botões
 * do site possam linkar direto para o formulário de cadastro.
 */
function showForm(mode) {
  forms.forEach((form) => {
    form.hidden = form.dataset.authForm !== mode;
  });

  const url = new URL(window.location.href);
  if (mode === 'register') {
    url.searchParams.set('modo', 'cadastro');
  } else {
    url.searchParams.delete('modo');
  }
  window.history.replaceState({}, '', url);
}

function setError(errorEl, message) {
  if (message) {
    errorEl.textContent = message;
    errorEl.hidden = false;
  } else {
    errorEl.textContent = '';
    errorEl.hidden = true;
  }
}

// Após logar/cadastrar: se veio de um plano específico, segue pro checkout
// daquele plano, senão, cadastro novo vai escolher um plano do zero e login
// de quem já tem conta vai direto pra área logada.
function redirectAfterAuth(isNewAccount) {
  if (planoParam) {
    window.location.href = `assinatura.html?plano=${planoParam}`;
    return;
  }

  window.location.href = isNewAccount ? 'assinatura.html' : 'minha-vitta.html';
}

// --- Alternância entre login e cadastro ---

document.querySelectorAll('[data-auth="go-to-register"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    showForm('register');
  });
});

document.querySelectorAll('[data-auth="go-to-login"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    showForm('login');
  });
});

// --- Login ---
// Qualquer e-mail/senha válidos são aceitos, e o nome
// exibido é derivado da parte antes do "@" do e-mail.

loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = loginForm.elements.namedItem('email').value.trim();
  const password = loginForm.elements.namedItem('password').value;

  setError(loginError, null);

  const submitButton = loginForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (!response.ok) {
      const message = result.errors?.map((error) => error.message).join(' ')
        || result.message
        || 'Não foi possível validar os dados.';
      setError(loginError, message);
      return;
    }

    const normalizedEmail = email.toLowerCase();
    const name = normalizedEmail.split('@')[0];
    setSession({ name, email: normalizedEmail, plan: null });

    redirectAfterAuth(false);
  } catch {
    setError(loginError, 'Não foi possível conectar ao servidor. Tente novamente.');
  } finally {
    submitButton.disabled = false;
  }
});

// --- Cadastro ---
// A validação principal acontece no backend via express-validator.

registerForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const name = registerForm.elements.namedItem('name').value.trim();
  const email = registerForm.elements.namedItem('email').value.trim();
  const password = registerForm.elements.namedItem('password').value;
  const passwordConfirm = registerForm.elements.namedItem('passwordConfirm').value;

  setError(registerError, null);

  const submitButton = registerForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, passwordConfirm }),
    });

    const result = await response.json();

    if (!response.ok) {
      const message = result.errors?.map((error) => error.message).join(' ')
        || result.message
        || 'Não foi possível validar os dados.';
      setError(registerError, message);
      return;
    }

    setSession({ name, email, plan: null });
    redirectAfterAuth(true);
  } catch {
    setError(registerError, 'Não foi possível conectar ao servidor. Tente novamente.');
  } finally {
    submitButton.disabled = false;
  }
});

// --- Estado inicial (permite abrir a página já no modo cadastro) ---

const initialMode = new URLSearchParams(window.location.search).get('modo') === 'cadastro' ? 'register' : 'login';
showForm(initialMode);