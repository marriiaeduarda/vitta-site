import { getSession, clearSession } from './session.js';

/* ---------------------------------------------------------------- */
/* Sessão: exige login                                                */
/* ---------------------------------------------------------------- */

const session = getSession();

if (!session) {
  window.location.href = 'entrar.html';
}

const currentPlan = session?.plan || 'black';

const PLAN_ORDER = ['start', 'move', 'plus', 'black', 'elite'];
const PLAN_LABELS = { start: 'Start', move: 'Move', plus: 'Plus', black: 'Black', elite: 'Elite' };

function planMeets(minPlan) {
  return PLAN_ORDER.indexOf(currentPlan) >= PLAN_ORDER.indexOf(minPlan);
}

const nutricaoDisponivel = planMeets('move');
const psicologiaDisponivel = planMeets('plus');

/* ---------------------------------------------------------------- */
/* Dados fictícios (em memória)      */
/* ---------------------------------------------------------------- */

const VENUES = [
  { id: 1, name: 'Academia Force', categories: ['Musculação', 'Funcional'], distance: '0.8 km', address: 'Rua das Flores, 42' },
  { id: 2, name: 'Studio Pilates Prime', categories: ['Pilates', 'Yoga'], distance: '1.2 km', address: 'Av. Paulista, 1500' },
  { id: 3, name: 'CrossFit Zona Sul', categories: ['CrossFit', 'Funcional'], distance: '1.5 km', address: 'Rua Consolação, 220' },
  { id: 4, name: 'Arte Suave BJJ', categories: ['Jiu-jitsu', 'Lutas'], distance: '2.0 km', address: 'Av. Brasil, 800' },
  { id: 5, name: 'Zen Yoga Center', categories: ['Yoga', 'Meditação'], distance: '2.2 km', address: 'Rua da Paz, 15' },
];

const NUTRI_PROFESSIONALS = [
  { name: 'Dra. Ana Lima', specialty: 'Nutrição Esportiva', credential: 'CRN 12345-SP', photo: 'medica.png' },
  { name: 'Dr. Carlos Mota', specialty: 'Nutrição Clínica', credential: 'CRN 67890-SP', photo: 'medico.png' },
];

const PSI_PROFESSIONALS = [
  { name: 'Dra. Fernanda Souza', specialty: 'Psicologia do Esporte', credential: 'CRP 06/12345', photo: 'psicologa.png' },
  { name: 'Dr. Rafael Costa', specialty: 'Terapia Cognitiva', credential: 'CRP 06/67890', photo: 'psicologo.png' },
];

function formatFutureDate(daysAhead, hour) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}, ${hour}h`;
}

// Estado inicial fictício — some ao recarregar a página (não é salvo).
let history = [
  { venue: 'Academia Force', category: 'Musculação', when: 'Hoje, 09:14' },
  { venue: 'Studio Pilates Prime', category: 'Pilates', when: 'Ontem, 18:30' },
];

let nutriAppointments = [
  { doctor: 'Dra. Ana Lima', when: formatFutureDate(7, 14), status: 'Agendada' },
  { doctor: 'Dra. Ana Lima', when: '05/09/2026, 14h', status: 'Realizada', note: 'Ajuste de macros para ganho de massa.' },
];

let psiAppointments = [
  { doctor: 'Dra. Fernanda Souza', when: formatFutureDate(10, 10), status: 'Agendada' },
];

/* ---------------------------------------------------------------- */
/* Cabeçalho: nome, inicial, plano, sair                              */
/* ---------------------------------------------------------------- */

document.querySelector('[data-dashboard="avatar-initial"]').textContent = session?.name.charAt(0).toUpperCase() || '';
document.querySelector('[data-dashboard="user-name"]').textContent = session?.name || '';
document.querySelector('[data-dashboard="plan-badge"]').textContent = `Vitta ${PLAN_LABELS[currentPlan]}`.toUpperCase();
document.querySelector('[data-dashboard="greeting-name"]').textContent = session?.name || '';

document.querySelectorAll('[data-dashboard="change-plan-link"], [data-dashboard="change-plan-link-mobile"]').forEach((link) => {
  link.href = `assinatura.html?plano=${currentPlan}&step=1`;
});

document.querySelector('[data-dashboard="logout"]').addEventListener('click', () => {
  clearSession();
  window.location.href = 'home.html';
});

/* ---------------------------------------------------------------- */
/* Navegação entre painéis (mantém estado ao trocar de item do menu)  */
/* ---------------------------------------------------------------- */

const panels = document.querySelectorAll('.dashboard-panel');
const navItems = document.querySelectorAll('[data-goto-panel]');

function goToPanel(panelName) {
  panels.forEach((panel) => {
    panel.hidden = panel.dataset.panel !== panelName;
  });

  document.querySelectorAll('.dashboard__nav-item').forEach((item) => {
    item.classList.toggle('is-active', item.dataset.gotoPanel === panelName);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

navItems.forEach((item) => {
  item.addEventListener('click', () => goToPanel(item.dataset.gotoPanel));
});

/* ---------------------------------------------------------------- */
/* Painel Início: estatísticas + último check-in                      */
/* ---------------------------------------------------------------- */

function renderStats() {
  document.querySelector('[data-dashboard="stat-checkins"]').textContent = String(history.length);
  document.querySelector('[data-dashboard="stat-nutricao"]').textContent = String(
    nutriAppointments.filter((a) => a.status === 'Agendada').length
  );
  document.querySelector('[data-dashboard="stat-psicologia"]').textContent = String(
    psiAppointments.filter((a) => a.status === 'Agendada').length
  );
  document.querySelector('[data-dashboard="stat-plano"]').textContent = PLAN_LABELS[currentPlan].toUpperCase();
}

function renderLastCheckin() {
  const container = document.querySelector('[data-dashboard="last-checkin"]');
  const last = history[0];

  if (!last) {
    container.innerHTML = '<p class="dashboard-last-checkin__empty">Você ainda não fez nenhum check-in.</p>';
    return;
  }

  container.innerHTML = `
    <span class="dashboard-last-checkin__icon" aria-hidden="true">✓</span>
    <div>
      <p class="dashboard-last-checkin__name">${last.venue}</p>
      <p class="dashboard-last-checkin__meta">${last.category} · ${last.when}</p>
    </div>
  `;
}

/* ---------------------------------------------------------------- */
/* Painel Histórico                                                    */
/* ---------------------------------------------------------------- */

function renderHistory() {
  const list = document.querySelector('[data-dashboard="history-list"]');
  list.innerHTML = '';

  history.forEach((entry) => {
    const li = document.createElement('li');
    li.className = 'dashboard-history-item';
    li.innerHTML = `
      <span class="dashboard-history-item__icon" aria-hidden="true">✓</span>
      <div class="dashboard-history-item__info">
        <p class="dashboard-history-item__name">${entry.venue}</p>
        <p class="dashboard-history-item__category">${entry.category}</p>
      </div>
      <span class="dashboard-history-item__when">${entry.when}</span>
    `;
    list.appendChild(li);
  });
}

/* ---------------------------------------------------------------- */
/* Painel Check-in                                                     */
/* ---------------------------------------------------------------- */

function performCheckin(venue, buttonEl, cardEl) {
  history.unshift({ venue: venue.name, category: venue.categories[0], when: 'Agora' });

  renderStats();
  renderLastCheckin();
  renderHistory();

  const originalLabel = buttonEl.textContent;
  buttonEl.textContent = '✓ Feito!';
  buttonEl.classList.add('is-done');
  cardEl.classList.add('is-done');

  setTimeout(() => {
    buttonEl.textContent = originalLabel;
    buttonEl.classList.remove('is-done');
    cardEl.classList.remove('is-done');
  }, 3000);
}

function renderVenues() {
  const list = document.querySelector('[data-dashboard="venues-list"]');
  list.innerHTML = '';

  VENUES.forEach((venue) => {
    const li = document.createElement('li');
    li.className = 'dashboard-venue';
    li.innerHTML = `
      <img class="dashboard-venue__icon" src="../../public/assets/icons/peso.svg" alt="" aria-hidden="true">
      <div class="dashboard-venue__info">
        <p class="dashboard-venue__name">${venue.name}</p>
        <p class="dashboard-venue__categories">${venue.categories.join(' / ')}</p>
        <p class="dashboard-venue__location">${venue.distance} · ${venue.address}</p>
      </div>
      <button type="button" class="dashboard-venue__button">Check-in</button>
    `;

    const button = li.querySelector('.dashboard-venue__button');
    button.addEventListener('click', () => performCheckin(venue, button, li));

    list.appendChild(li);
  });
}

/* ---------------------------------------------------------------- */
/* Painéis Nutrição / Psicologia                                       */
/* ---------------------------------------------------------------- */

function renderGate(type) {
  const gateEl = document.querySelector(`[data-dashboard="${type}-gate"]`);

  if (type === 'nutricao' && !nutricaoDisponivel) {
    gateEl.innerHTML = 'Disponível a partir do plano <strong>VITTA MOVE</strong>. Faça upgrade para agendar consultas com nutricionistas.';
    gateEl.hidden = false;
  } else if (type === 'psicologia' && !psicologiaDisponivel) {
    gateEl.innerHTML = 'Disponível a partir do plano <strong>VITTA PLUS</strong>. Sessões com psicólogos especializados em saúde mental, esporte e bem-estar.';
    gateEl.hidden = false;
  } else {
    gateEl.hidden = true;
  }
}

function renderAppointments(type) {
  const list = document.querySelector(`[data-dashboard="${type}-appointments"]`);
  const appointments = type === 'nutricao' ? nutriAppointments : psiAppointments;

  list.innerHTML = '';

  appointments.forEach((appointment) => {
    const li = document.createElement('li');
    li.className = 'dashboard-appointment';
    li.innerHTML = `
      <span class="dashboard-appointment__dot ${appointment.status === 'Realizada' ? 'is-done' : ''}" aria-hidden="true"></span>
      <div>
        <p class="dashboard-appointment__name">${appointment.doctor}</p>
        <p class="dashboard-appointment__meta">${appointment.when} · ${appointment.status}</p>
        ${appointment.note ? `<p class="dashboard-appointment__note">${appointment.note}</p>` : ''}
      </div>
    `;
    list.appendChild(li);
  });
}

function scheduleAppointment(type, doctorName) {
  const entry = { doctor: doctorName, when: formatFutureDate(type === 'nutricao' ? 7 : 10, type === 'nutricao' ? 14 : 10), status: 'Agendada' };

  if (type === 'nutricao') {
    nutriAppointments.unshift(entry);
  } else {
    psiAppointments.unshift(entry);
  }

  renderAppointments(type);
  renderStats();
}

function renderProfessionals(type) {
  const container = document.querySelector(`[data-dashboard="${type}-professionals"]`);
  const professionals = type === 'nutricao' ? NUTRI_PROFESSIONALS : PSI_PROFESSIONALS;
  const available = type === 'nutricao' ? nutricaoDisponivel : psicologiaDisponivel;

  container.innerHTML = '';

  professionals.forEach((professional) => {
    const card = document.createElement('div');
    card.className = 'dashboard-professional';
    card.innerHTML = `
      <div class="dashboard-professional__header">
        <img class="dashboard-professional__photo" src="../../public/assets/images/${professional.photo}" alt="" aria-hidden="true">
        <div>
          <p class="dashboard-professional__name">${professional.name}</p>
          <p class="dashboard-professional__specialty">${professional.specialty}</p>
          <p class="dashboard-professional__credential">${professional.credential}</p>
        </div>
      </div>
      <button type="button" class="dashboard-professional__button" ${available ? '' : 'disabled'}>
        Agendar ${type === 'nutricao' ? 'consulta' : 'sessão'}
      </button>
    `;

    const button = card.querySelector('.dashboard-professional__button');
    if (available) {
      button.addEventListener('click', () => scheduleAppointment(type, professional.name));
    }

    container.appendChild(card);
  });
}

/* ---------------------------------------------------------------- */
/* Renderização inicial                                                */
/* ---------------------------------------------------------------- */

renderStats();
renderLastCheckin();
renderHistory();
renderVenues();

renderGate('nutricao');
renderProfessionals('nutricao');
renderAppointments('nutricao');

renderGate('psicologia');
renderProfessionals('psicologia');
renderAppointments('psicologia');

goToPanel('inicio');