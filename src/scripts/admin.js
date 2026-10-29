import { getSession, clearSession, isAdmin } from './session.js';
import { initUsers } from './admin-users.js';
import { initPartners } from './admin-partners.js';
import { initPlans } from './admin-plans.js';

/* ---------------------------------------------------------------- */
/* Acesso: só o administrador entra nesta página                      */
/* ---------------------------------------------------------------- */

const session = getSession();

if (!session) {
  window.location.replace('entrar.html');
} else if (!isAdmin(session)) {
  window.location.replace('minha-vitta.html');
} else {
  initAdmin();
}

function initAdmin() {
  /* -------------------------------------------------------------- */
  /* Cabeçalho: inicial, nome e sair                                  */
  /* -------------------------------------------------------------- */

  document.querySelector('[data-admin="avatar-initial"]').textContent = session.name.charAt(0).toUpperCase();
  document.querySelector('[data-admin="user-name"]').textContent = session.name;

  document.querySelector('[data-admin="logout"]').addEventListener('click', () => {
    clearSession();
    window.location.href = 'home.html';
  });

  /* -------------------------------------------------------------- */
  /* Navegação entre painéis (mantém o estado ao trocar de item)      */
  /* -------------------------------------------------------------- */

  const panels = document.querySelectorAll('.dashboard-panel');
  const navItems = document.querySelectorAll('.dashboard__nav-item');

  function goToPanel(panelName) {
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.panel !== panelName;
    });

    navItems.forEach((item) => {
      const isActive = item.dataset.gotoPanel === panelName;
      item.classList.toggle('is-active', isActive);

      if (isActive) {
        item.setAttribute('aria-current', 'page');
      } else {
        item.removeAttribute('aria-current');
      }
    });

    if (panelName === 'users') users?.reload();
    if (panelName === 'plans') plans?.reload();

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navItems.forEach((item) => {
    item.addEventListener('click', () => goToPanel(item.dataset.gotoPanel));
  });

  const users = initUsers(document.querySelector('[data-admin="users-content"]'));
  initPartners(document.querySelector('[data-admin="partners-content"]'));
  const plans = initPlans(document.querySelector('[data-admin="plans-content"]'));

  goToPanel('users');
}
