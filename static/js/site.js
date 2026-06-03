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

const revealTargets = document.querySelectorAll(
    '.top-info-section, .journal-section, .sdg-note-section, .feature-band, .flow-section, .tool-section, .resource-section, .wellness-marquee'
);

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
    revealTargets.forEach((target) => target.classList.add('reveal-section'));

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
        });
    }, { threshold: 0.16 });

    revealTargets.forEach((target) => revealObserver.observe(target));
} else {
    revealTargets.forEach((target) => target.classList.add('is-visible'));
}
