export default async function decorate(block) {
  const navMeta = document.querySelector('meta[name="nav"]');
  if (!navMeta) return;

  const navPath = navMeta.getAttribute('content');
  const resp = await fetch(`${navPath}.plain.html`);
  const html = await resp.text();

  const temp = document.createElement('div');
  temp.innerHTML = html;

  const nav = document.createElement('nav');
  nav.className = 'nav-new';

  /* =========================
     UTILITY NAV
  ========================= */
  const utilityWrapper = document.createElement('div');
  utilityWrapper.className = 'nav-new-utility';

  const utilityLeft = document.createElement('div');
  utilityLeft.className = 'nav-new-utility-left';

  temp.querySelectorAll('p').forEach((p) => {
    const link = p.querySelector('a');
    if (link) {
      const a = document.createElement('a');
      a.href = link.href;
      a.textContent = link.textContent;
      a.className = 'nav-new-utility-link';
      utilityLeft.appendChild(a);
    }
  });

  utilityWrapper.appendChild(utilityLeft);

  /* =========================
     MAIN NAV SHELL
  ========================= */
  const shell = document.createElement('div');
  shell.className = 'nav-new-shell';

  /* =========================
     BRAND (UPDATED LOGO)
  ========================= */
  const brand = document.createElement('div');
  brand.className = 'nav-new-brand';

  const brandLink = document.createElement('a');
  brandLink.href = '/';
  brandLink.className = 'nav-new-brand-link';
  brandLink.setAttribute('aria-label', 'Blue Shield of California');

  const logo = document.createElement('img');
  logo.src = '/group/icons/logo.svg';
  logo.alt = 'Blue Shield of California';
  logo.width = 110;

  brandLink.appendChild(logo);
  brand.appendChild(brandLink);

  /* =========================
     MAIN NAV
  ========================= */
  const mainNav = document.createElement('div');
  mainNav.className = 'nav-new-main';

  const ul = temp.querySelector('ul');
  if (ul) {
    ul.classList.add('nav-new-list');

    ul.querySelectorAll(':scope > li').forEach((li, index) => {
      li.classList.add('nav-new-item');

      const subMenu = li.querySelector('ul');

      if (subMenu) {
        li.classList.add('has-dropdown');

        const button = document.createElement('button');
        button.className = 'nav-new-link nav-new-dropdown-toggle';
        button.innerHTML = li.firstChild.textContent;

        const chevron = document.createElement('span');
        chevron.className = 'nav-new-chevron';
        button.appendChild(chevron);

        li.innerHTML = '';
        li.appendChild(button);

        const dropdown = document.createElement('div');
        dropdown.className = 'nav-new-dropdown';

        subMenu.classList.add('nav-new-dropdown-list');

        subMenu.querySelectorAll(':scope > li').forEach((subLi, i) => {
          const link = subLi.querySelector('a');

          if (link) {
            link.classList.add('nav-new-dropdown-link');

            if (i === 0) {
              link.classList.add('is-featured');
            }
          }

          subLi.classList.add('nav-new-dropdown-item');
        });

        dropdown.appendChild(subMenu);
        li.appendChild(dropdown);

        /* Toggle */
        button.addEventListener('click', () => {
          const isOpen = li.classList.contains('is-open');

          document.querySelectorAll('.nav-new-item.is-open')
            .forEach((openItem) => openItem.classList.remove('is-open'));

          if (!isOpen) {
            li.classList.add('is-open');
          }
        });

      } else {
        const link = li.querySelector('a');
        if (link) {
          link.classList.add('nav-new-link');
        }
      }
    });

    mainNav.appendChild(ul);
  }

  /* =========================
     ACTIONS (LOGIN)
  ========================= */
  const actions = document.createElement('div');
  actions.className = 'nav-new-actions';

  const login = document.createElement('a');
  login.href = 'https://www.blueshieldca.com/';
  login.textContent = 'Log in / Register';
  login.className = 'nav-new-login';

  actions.appendChild(login);

  /* =========================
     HAMBURGER
  ========================= */
  const hamburger = document.createElement('div');
  hamburger.className = 'nav-new-hamburger';

  const hamburgerBtn = document.createElement('button');
  hamburgerBtn.className = 'nav-new-hamburger-button';
  hamburgerBtn.setAttribute('aria-label', 'Open navigation');

  hamburgerBtn.innerHTML = '<span class="nav-new-hamburger-icon"></span>';

  hamburger.appendChild(hamburgerBtn);

  /* =========================
     ASSEMBLE
  ========================= */
  shell.appendChild(brand);
  shell.appendChild(mainNav);
  shell.appendChild(actions);

  nav.appendChild(utilityWrapper);
  nav.appendChild(shell);
  nav.appendChild(hamburger);

  block.innerHTML = '';
  block.appendChild(nav);
}
