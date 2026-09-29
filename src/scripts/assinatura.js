/* ---------------------------------------------------------------- */
/* Dados dos planos (mesmos valores da seção Planos da Home)          */
/* ---------------------------------------------------------------- */

const PLANS = {
  start: {
    name: 'Vitta Start',
    price: 'R$59,90',
    features: ['Musculação', 'Funcional', 'Corrida e Caminhada', 'Hidroginástica', 'Ciclismo Indoor'],
    nutricao: 'X',
    psicologia: 'X',
  },
  move: {
    name: 'Vitta Move',
    price: 'R$89,90',
    features: ['Tudo do START', 'Boxe', 'Muay Thai', 'Jiu-jitsu', 'Judô', 'Karatê'],
    nutricao: '1×/mês',
    psicologia: 'X',
  },
  plus: {
    name: 'Vitta Plus',
    price: 'R$119,90',
    features: ['Tudo do MOVE', 'Yoga', 'Pilates', 'Dança', 'Zumba', 'Pole Dance'],
    nutricao: '2×/mês',
    psicologia: '1×/mês',
  },
  black: {
    name: 'Vitta Black',
    price: 'R$159,90',
    features: ['Tudo do PLUS', 'Natação', 'Beach Tennis', 'Vôlei de Praia', 'Futevôlei', 'Spinning'],
    nutricao: 'Ilimitada',
    psicologia: '2×/mês',
  },
  elite: {
    name: 'Vitta Elite',
    price: 'R$229,90',
    features: ['Tudo do BLACK', 'Surf', 'Stand Up Paddle', 'Trekking', 'Esportes Radicais', 'Aulas Particulares'],
    nutricao: 'Ilimitada + personalizada',
    psicologia: 'Ilimitada',
  },
};

const MAX_SUMMARY_FEATURES = 5;

/* ---------------------------------------------------------------- */
/* Elementos                                                          */
/* ---------------------------------------------------------------- */

const steps = document.querySelectorAll('.checkout-step');
const stepIndicators = document.querySelectorAll('[data-step-indicator]');
const planInputs = document.querySelectorAll('input[name="plano"]');
const submitButton = document.querySelector('[data-checkout="submit"]');
const submitLabel = document.querySelector('[data-checkout="submit-label"]');

let currentStep = 1;
let selectedPlan = 'black';
let selectedPaymentMethod = 'cartao';

/* ---------------------------------------------------------------- */
/* Navegação entre etapas                                             */
/* ---------------------------------------------------------------- */

function goToStep(stepNumber) {
  currentStep = stepNumber;

  steps.forEach((step) => {
    step.hidden = Number(step.dataset.step) !== stepNumber;
  });

  stepIndicators.forEach((indicator) => {
    const indicatorStep = Number(indicator.dataset.stepIndicator);
    indicator.classList.toggle('is-active', indicatorStep === stepNumber);
    indicator.classList.toggle('is-complete', indicatorStep < stepNumber);

    const circle = indicator.querySelector('.checkout__step-circle');
    circle.textContent = indicatorStep < stepNumber ? '✓' : String(indicatorStep);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('[data-goto-step]').forEach((button) => {
  button.addEventListener('click', () => {
    goToStep(Number(button.dataset.gotoStep));
  });
});

/* ---------------------------------------------------------------- */
/* Seleção de plano + Resumo reativo                                   */
/* ---------------------------------------------------------------- */

function renderSummary(planKey) {
  const plan = PLANS[planKey];
  if (!plan) return;

  document.querySelector('[data-checkout="summary-badge"]').textContent = plan.name;
  document.querySelector('[data-checkout="summary-price"]').textContent = plan.price;
  submitLabel.textContent = `Assinar por ${plan.price}/mês`;

  const featuresList = document.querySelector('[data-checkout="summary-features"]');
  featuresList.innerHTML = '';

  const shown = plan.features.slice(0, MAX_SUMMARY_FEATURES);
  const remaining = plan.features.length - shown.length;

  shown.forEach((feature) => {
    const li = document.createElement('li');
    li.innerHTML = `<img src="../../public/assets/icons/verificacao.svg" alt="" loading="lazy">${feature}`;
    featuresList.appendChild(li);
  });

  const moreEl = document.querySelector('[data-checkout="summary-more"]');
  moreEl.textContent = remaining > 0 ? `+${remaining} modalidade${remaining === 1 ? '' : 's'}` : '';

  document.querySelector('[data-checkout="summary-nutricao"]').textContent = plan.nutricao;
  document.querySelector('[data-checkout="summary-psicologia"]').textContent = plan.psicologia;
}

function selectPlan(planKey) {
  selectedPlan = planKey;

  planInputs.forEach((input) => {
    input.checked = input.value === planKey;
  });

  renderSummary(planKey);
}

planInputs.forEach((input) => {
  input.addEventListener('change', () => {
    if (input.checked) selectPlan(input.value);
  });
});

/* ---------------------------------------------------------------- */
/* Máscaras de campos numéricos                                       */
/* ---------------------------------------------------------------- */

function onlyDigits(value) {
  return value.replace(/\D/g, '');
}

function maskCpf(value) {
  const digits = onlyDigits(value).slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

function maskCep(value) {
  const digits = onlyDigits(value).slice(0, 8);
  return digits.replace(/^(\d{5})(\d)/, '$1-$2');
}

function maskPhone(value) {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 10) {
    return digits.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
  }

  return digits.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
}

function maskCardNumber(value) {
  const digits = onlyDigits(value).slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function maskExpiry(value) {
  const digits = onlyDigits(value).slice(0, 4);
  return digits.replace(/^(\d{2})(\d)/, '$1/$2');
}

function applyMask(input, maskFn) {
  input.addEventListener('input', () => {
    input.value = maskFn(input.value);
  });
}

applyMask(document.getElementById('cpf'), maskCpf);
applyMask(document.getElementById('celular'), maskPhone);
applyMask(document.getElementById('cep-checkout'), maskCep);
applyMask(document.getElementById('numero-cartao'), maskCardNumber);
applyMask(document.getElementById('validade-cartao'), maskExpiry);
document.getElementById('cvv-cartao').addEventListener('input', (event) => {
  event.target.value = onlyDigits(event.target.value).slice(0, 4);
});

/* ---------------------------------------------------------------- */
/* Validação (habilita/desabilita "Continuar")                        */
/* ---------------------------------------------------------------- */

function isStepValid(stepEl) {
  const requiredFields = stepEl.querySelectorAll('input[required]');

  for (const field of requiredFields) {
    // Ignora campos dentro de um painel de pagamento escondido (PIX/Boleto).
    const panel = field.closest('[data-payment-panel]');
    if (panel && panel.hidden) continue;

    if (!field.value.trim()) return false;
  }

  return true;
}

function wireStepValidation(stepEl) {
  const button = stepEl.dataset.step === '3'
    ? submitButton
    : stepEl.querySelector('.checkout-step__actions--split button:last-child');

  if (!button) return;

  const update = () => {
    button.disabled = !isStepValid(stepEl);
  };

  stepEl.querySelectorAll('input').forEach((field) => {
    field.addEventListener('input', update);
  });

  update();
}

steps.forEach(wireStepValidation);

/* ---------------------------------------------------------------- */
/* Abas de forma de pagamento                                         */
/* ---------------------------------------------------------------- */

const paymentTabs = document.querySelectorAll('[data-payment-method]');
const paymentPanels = document.querySelectorAll('[data-payment-panel]');
const paymentStepEl = document.querySelector('.checkout-step[data-step="3"]');

function selectPaymentMethod(method) {
  selectedPaymentMethod = method;

  paymentTabs.forEach((tab) => {
    const isActive = tab.dataset.paymentMethod === method;
    tab.classList.toggle('is-active', isActive);
    tab.setAttribute('aria-selected', String(isActive));
  });

  paymentPanels.forEach((panel) => {
    panel.hidden = panel.dataset.paymentPanel !== method;
  });

  // PIX e Boleto não têm campos obrigatórios visíveis; Cartão tem.
  submitButton.disabled = !isStepValid(paymentStepEl);
}

paymentTabs.forEach((tab) => {
  tab.addEventListener('click', () => selectPaymentMethod(tab.dataset.paymentMethod));
});

/* ---------------------------------------------------------------- */
/* Envio da assinatura                                                */
/* ---------------------------------------------------------------- */

const checkoutMain = document.querySelector('.checkout__main');
const successView = document.querySelector('[data-checkout="success-view"]');

submitButton.addEventListener('click', () => {
  const plan = PLANS[selectedPlan];

  document.querySelector('[data-checkout="success-plan-name"]').textContent = plan.name.toUpperCase();

  // Este projeto não tem back-end (TCC): não há processamento real de pagamento aqui.
  console.log('Assinatura simulada:', { plano: selectedPlan, metodo: selectedPaymentMethod });

  checkoutMain.hidden = true;
  successView.hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Redireciona automaticamente para a Home após 5s, caso o usuário
  // permaneça na tela sem clicar em "Acessar minha Vitta".
  setTimeout(() => {
    window.location.href = 'home.html';
  }, 5000);
});

/* ---------------------------------------------------------------- */
/* Estado inicial: lê ?plano= da URL                                   */
/* ---------------------------------------------------------------- */

const requestedPlan = new URLSearchParams(window.location.search).get('plano');
const initialPlan = PLANS[requestedPlan] ? requestedPlan : 'black';

selectPlan(initialPlan);

// Se a URL já veio com um plano específico, pula direto para a etapa 2.
goToStep(requestedPlan && PLANS[requestedPlan] ? 2 : 1);