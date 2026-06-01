const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
const siteNav = document.getElementById('site-nav');

function setMobileNav(open) {
    if (!mobileNavToggle || !siteNav) return;

    mobileNavToggle.setAttribute('aria-expanded', String(open));
    siteNav.classList.toggle('is-open', open);
}

mobileNavToggle?.addEventListener('click', () => {
    const isOpen = mobileNavToggle.getAttribute('aria-expanded') === 'true';
    setMobileNav(!isOpen);
});

siteNav?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMobileNav(false));
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        setMobileNav(false);
    }
});

document.addEventListener('click', (event) => {
    if (!siteNav?.classList.contains('is-open')) return;
    if (siteNav.contains(event.target) || mobileNavToggle?.contains(event.target)) return;

    setMobileNav(false);
});
