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
    // As etapas seguintes só avançam depois da validação no backend.
    // Os botões Voltar continuam navegando sem uma nova validação.
    if (button.classList.contains('wizard-next')) return;
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

function wireStepValidation(stepEl) {
  const stepNumber = Number(stepEl.dataset.step);
  const errorElement = stepEl.querySelector('[data-step-error]');
  const fields = stepEl.querySelectorAll('input, select, textarea');

  // Ao editar um campo, ocultamos a mensagem anterior. A validação oficial
  // acontece no backend quando a pessoa clica em Continuar/Enviar.
  fields.forEach((field) => {
    const clearError = () => {
      if (errorElement) {
        errorElement.textContent = '';
        errorElement.hidden = true;
      }
    };
    field.addEventListener('input', clearError);
    field.addEventListener('change', clearError);
  });

  // Mantém o número da etapa disponível para os handlers de navegação.
  stepEl.dataset.validationStep = String(stepNumber);
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

function getPartnerPayload() {
  return {
    nomeEstabelecimento: document.getElementById('nome-estabelecimento').value,
    cnpj: document.getElementById('cnpj').value,
    categoria: document.getElementById('categoria').value,
    descricao: document.getElementById('descricao').value,
    rua: document.getElementById('rua').value,
    numero: document.getElementById('numero').value,
    complemento: document.getElementById('complemento').value,
    bairro: document.getElementById('bairro').value,
    cep: document.getElementById('cep').value,
    cidade: document.getElementById('cidade').value,
    uf: document.getElementById('uf').value,
    modalidades: Array.from(document.querySelectorAll('[data-partner-signup="modalidades"] input:checked'), (input) => input.value),
    responsavel: document.getElementById('responsavel').value,
    telefone: document.getElementById('telefone').value,
    email: document.getElementById('email-contato').value,
    site: document.getElementById('site').value,
    instagram: document.getElementById('instagram').value,
    aceiteTermos: document.getElementById('aceite-termos').checked,
  };
}

function showStepError(stepNumber, message) {
  const errorElement = document.querySelector(`[data-step-error="${stepNumber}"]`);
  if (!errorElement) return;
  errorElement.textContent = message || '';
  errorElement.hidden = !message;
}

async function validatePartnerStep(stepNumber) {
  const stepElement = document.querySelector(`.wizard-step[data-step="${stepNumber}"]`);
  const nextButton = stepElement.querySelector('.wizard-next');
  showStepError(stepNumber, '');

  if (nextButton) {
    nextButton.disabled = true;
    nextButton.dataset.originalText = nextButton.textContent;
    nextButton.textContent = 'Validando...';
  }

  try {
    const response = await fetch('/api/partners/validate-step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...getPartnerPayload(), step: stepNumber }),
    });
    const result = await response.json();

    if (!response.ok) {
      const messages = result.errors?.map((error) => error.message) || [];
      showStepError(stepNumber, [...new Set(messages)].join(' ') || result.message || 'Revise os dados desta etapa.');
      return false;
    }

    return true;
  } catch {
    showStepError(stepNumber, 'Não foi possível conectar ao servidor. Tente novamente.');
    return false;
  } finally {
    if (nextButton) {
      nextButton.disabled = false;
      nextButton.textContent = nextButton.dataset.originalText || 'Continuar';
      delete nextButton.dataset.originalText;
    }
  }
}

document.querySelectorAll('.wizard-next').forEach((button) => {
  button.addEventListener('click', async () => {
    const currentStepNumber = Number(button.closest('.wizard-step').dataset.step);
    const isValid = await validatePartnerStep(currentStepNumber);
    if (!isValid) return;

    const nextStepNumber = Number(button.dataset.gotoStep);
    if (nextStepNumber === 4) updateSummary();
    goToStep(nextStepNumber);
  });
});

const submitButton = document.querySelector('[data-partner-signup="submit"]');
const submitError = document.querySelector('[data-partner-signup="error"]');

function showSubmitError(message) {
  submitError.textContent = message || '';
  submitError.hidden = !message;
}

submitButton.addEventListener('click', async () => {
  showSubmitError('');

  const payload = getPartnerPayload();

  submitButton.disabled = true;
  const originalButtonText = submitButton.textContent.trim();
  submitButton.textContent = 'Validando...';

  try {
    const response = await fetch('/api/partners/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    if (!response.ok) {
      const messages = result.errors?.map((error) => error.message) || [];
      showSubmitError([...new Set(messages)].join(' ')
        || result.message
        || 'Não foi possível validar os dados. Revise o formulário.');
      return;
    }

    const nomeResponsavel = payload.responsavel.trim();
    const primeiroNome = nomeResponsavel.split(/\s+/)[0];
    document.querySelector('[data-partner-signup="success-name"]').textContent = primeiroNome;
    document.querySelector('[data-partner-signup="success-email"]').textContent = payload.email.trim();

    // O backend apenas valida os dados
    console.log(result.message);
    formView.hidden = true;
    successView.hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch {
    showSubmitError('Não foi possível conectar ao servidor. Tente novamente.');
  } finally {
    submitButton.textContent = originalButtonText;
    submitButton.disabled = false;
  }
});

/* ---------------------------------------------------------------- */
/* Estado inicial                                                     */
/* ---------------------------------------------------------------- */

goToStep(1);