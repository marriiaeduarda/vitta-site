const forms = document.querySelectorAll('[data-auth-form]');
const loginForm = document.querySelector('[data-auth="login-form"]');
const registerForm = document.querySelector('[data-auth="register-form"]');
const loginError = document.querySelector('[data-auth="login-error"]');
const registerError = document.querySelector('[data-auth="register-error"]');

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

// --- Validação do login ---

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

  console.log('Login simulado:', { email });
});

// --- Validação do cadastro ---

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

  console.log('Cadastro simulado:', { name, email });
});

// --- Estado inicial (permite abrir a página já no modo cadastro) ---

const initialMode = new URLSearchParams(window.location.search).get('modo') === 'cadastro' ? 'register' : 'login';
showForm(initialMode);