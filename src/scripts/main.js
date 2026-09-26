const siteHeader = document.querySelector('.site-header');
const menuButton = document.querySelector('.site-header__menu-button');
const mobileMenu = document.querySelector('#mobile-menu');
const mobileMenuLinks = mobileMenu?.querySelectorAll('a');

const setScrolledHeader = () => {
  siteHeader?.classList.toggle('is-scrolled', window.scrollY > 0);
};

const setMobileMenuState = (isOpen) => {
  siteHeader?.classList.toggle('is-menu-open', isOpen);
  mobileMenu?.classList.toggle('is-open', isOpen);

  menuButton?.setAttribute('aria-expanded', String(isOpen));
  menuButton?.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
  mobileMenu?.setAttribute('aria-hidden', String(!isOpen));
  document.body.classList.toggle('menu-open', isOpen);
};

const loadSections = async () => {
  const sectionContainers = document.querySelectorAll('[data-section]');

  await Promise.all(
    [...sectionContainers].map(async (container) => {
      const sectionName = container.dataset.section;
      const sectionPath = `../sections/${sectionName}/${sectionName}.html`;

      try {
        const response = await fetch(sectionPath);

        if (!response.ok) {
          throw new Error(`Não foi possível carregar a seção: ${sectionName}`);
        }

        container.innerHTML = await response.text();
        
        container.dispatchEvent(
          new CustomEvent('section:loaded', {
            detail: { sectionName },
            bubbles: true,
          })
        );
      } catch (error) {
        console.error(error);
      }
    })
  );
};

menuButton?.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  setMobileMenuState(!isOpen);
});

mobileMenuLinks?.forEach((link) => {
  link.addEventListener('click', () => {
    setMobileMenuState(false);
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    setMobileMenuState(false);
  }
});

window.addEventListener('scroll', setScrolledHeader, { passive: true });

setScrolledHeader();
loadSections();