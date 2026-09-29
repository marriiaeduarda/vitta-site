const formView = document.querySelector('[data-partner-signup="form-view"]');
const successView = document.querySelector('[data-partner-signup="success-view"]');
const steps = document.querySelectorAll('.wizard-step');
const stepIndicators = document.querySelectorAll('[data-step-indicator]');

let currentStep = 1;

/* ---------------------------------------------------------------- */
/* Navegação entre etapas                                            */
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

    const circle = indicator.querySelector('.partner-signup__step-circle');
    circle.textContent = indicatorStep < stepNumber ? '✓' : String(indicatorStep);
  });

  // Rola a página inteira para o topo (não só o <main>), para que a
  // barra superior (logo/título/cancelar) continue visível após navegar
  // entre etapas.
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('[data-goto-step]').forEach((button) => {
  button.addEventListener('click', () => {
    goToStep(Number(button.dataset.gotoStep));
  });
});

/* ---------------------------------------------------------------- */
/* Máscaras de campos numéricos                                      */
/* ---------------------------------------------------------------- */

function onlyDigits(value) {
  return value.replace(/\D/g, '');
}

function maskCnpj(value) {
  const digits = onlyDigits(value).slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function maskCep(value) {
  const digits = onlyDigits(value).slice(0, 8);
  return digits.replace(/^(\d{5})(\d)/, '$1-$2');
}

function maskPhone(value) {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }

  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

function applyMask(input, maskFn) {
  input.addEventListener('input', () => {
    input.value = maskFn(input.value);
  });
}

applyMask(document.getElementById('cnpj'), maskCnpj);
applyMask(document.getElementById('cep'), maskCep);
applyMask(document.getElementById('telefone'), maskPhone);

/* ---------------------------------------------------------------- */
/* Contador de caracteres da descrição                                */
/* ---------------------------------------------------------------- */

const descricaoInput = document.getElementById('descricao');
const descricaoCount = document.querySelector('[data-partner-signup="descricao-count"]');

descricaoInput.addEventListener('input', () => {
  descricaoCount.textContent = String(descricaoInput.value.length);
});

/* ---------------------------------------------------------------- */
/* Habilita/desabilita o botão "Continuar" de cada etapa              */
/* ---------------------------------------------------------------- */

function isStepValid(stepEl) {
  const requiredFields = stepEl.querySelectorAll('input[required], select[required], textarea[required]');

  for (const field of requiredFields) {
    if (!field.value.trim()) return false;
  }

  // Etapa 3 (modalidades) tem sua própria regra: pelo menos 1 selecionada.
  const modalidadesGroup = stepEl.querySelector('[data-partner-signup="modalidades"]');
  if (modalidadesGroup) {
    const checked = modalidadesGroup.querySelectorAll('input:checked');
    if (checked.length === 0) return false;
  }

  return true;
}

function wireStepValidation(stepEl) {
  const nextButton = stepEl.querySelector('.wizard-next');
  const submitButton = stepEl.querySelector('[data-partner-signup="submit"]');
  const button = nextButton || submitButton;
  if (!button) return;

  const fields = stepEl.querySelectorAll('input, select, textarea');

  const update = () => {
    let valid = isStepValid(stepEl);

    // Etapa 4 também exige o checkbox de aceite marcado.
    const aceite = stepEl.querySelector('#aceite-termos');
    if (aceite && !aceite.checked) valid = false;

    button.disabled = !valid;
  };

  fields.forEach((field) => {
    field.addEventListener('input', update);
    field.addEventListener('change', update);
  });

  update();
}

steps.forEach(wireStepValidation);

/* ---------------------------------------------------------------- */
/* Resumo do cadastro (etapa 4)                                       */
/* ---------------------------------------------------------------- */

function updateSummary() {
  const nome = document.getElementById('nome-estabelecimento').value.trim();
  const categoriaSelect = document.getElementById('categoria');
  const categoriaLabel = categoriaSelect.selectedOptions[0]?.textContent || '';
  const cidade = document.getElementById('cidade').value.trim();
  const bairro = document.getElementById('bairro').value.trim();
  const uf = document.getElementById('uf').value;
  const modalidadesCount = document.querySelectorAll('[data-partner-signup="modalidades"] input:checked').length;

  document.querySelector('[data-partner-signup="summary-line-1"]').textContent = `${nome} — ${categoriaLabel}`;
  document.querySelector('[data-partner-signup="summary-line-2"]').textContent = `${cidade} — ${bairro}/${uf}`;
  document.querySelector('[data-partner-signup="summary-line-3"]').textContent = `${modalidadesCount} modalidades selecionadas`;
}

// Atualiza o resumo sempre que a etapa 4 for exibida.
document.querySelectorAll('[data-goto-step="4"]').forEach((button) => {
  button.addEventListener('click', updateSummary);
});

/* ---------------------------------------------------------------- */
/* Contador de modalidades selecionadas                               */
/* ---------------------------------------------------------------- */

const modalidadesGroup = document.querySelector('[data-partner-signup="modalidades"]');
const modalidadesCountLabel = document.querySelector('[data-partner-signup="modalidades-count"]');

modalidadesGroup.addEventListener('change', () => {
  const checked = modalidadesGroup.querySelectorAll('input:checked').length;
  modalidadesCountLabel.textContent = String(checked);
});

/* ---------------------------------------------------------------- */
/* Envio do cadastro                                                  */
/* ---------------------------------------------------------------- */

const submitButton = document.querySelector('[data-partner-signup="submit"]');

submitButton.addEventListener('click', () => {
  const nomeResponsavel = document.getElementById('responsavel').value.trim();
  const email = document.getElementById('email-contato').value.trim();
  const primeiroNome = nomeResponsavel.split(' ')[0];

  document.querySelector('[data-partner-signup="success-name"]').textContent = primeiroNome;
  document.querySelector('[data-partner-signup="success-email"]').textContent = email;

  // Este projeto não tem back-end (TCC): não há envio real do cadastro aqui.
  console.log('Cadastro de parceiro simulado.');

  formView.hidden = true;
  successView.hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ---------------------------------------------------------------- */
/* Estado inicial                                                     */
/* ---------------------------------------------------------------- */

goToStep(1);