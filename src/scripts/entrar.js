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

function isValidEmail(value) {
  return value.includes('@');
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

loginForm?.addEventListener('submit', (event) => {
  event.preventDefault();

  const email = loginForm.email.value.trim();
  const password = loginForm.password.value;

  if (!email || !password) {
    setError(loginError, 'Preencha todos os campos.');
    return;
  }

  if (!isValidEmail(email)) {
    setError(loginError, 'Digite um e-mail válido.');
    return;
  }

  setError(loginError, null);

  const name = email.split('@')[0];
  setSession({ name, email, plan: null });

  redirectAfterAuth(false);
});

// --- Cadastro ---

registerForm?.addEventListener('submit', (event) => {
  event.preventDefault();

  const name = registerForm.name.value.trim();
  const email = registerForm.email.value.trim();
  const password = registerForm.password.value;
  const passwordConfirm = registerForm.passwordConfirm.value;

  if (!name || !email || !password || !passwordConfirm) {
    setError(registerError, 'Preencha todos os campos.');
    return;
  }

  if (!isValidEmail(email)) {
    setError(registerError, 'Digite um e-mail válido.');
    return;
  }

  if (password !== passwordConfirm) {
    setError(registerError, 'As senhas não coincidem.');
    return;
  }

  setError(registerError, null);

  setSession({ name, email, plan: null });

  redirectAfterAuth(true);
});

// --- Estado inicial (permite abrir a página já no modo cadastro) ---

const initialMode = new URLSearchParams(window.location.search).get('modo') === 'cadastro' ? 'register' : 'login';
showForm(initialMode);