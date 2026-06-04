const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
const siteNav = document.getElementById('site-nav');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

// 用來判斷是否應該對點擊的連結使用頁面轉場動畫
function shouldUsePageTransition(link, event) {
    if (!link || prefersReducedMotion) return false;
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
    if (event.button !== 0) return false;
    if (link.target || link.hasAttribute('download')) return false;

    const url = new URL(link.href, window.location.href);
    const currentUrl = new URL(window.location.href);
    if (url.origin !== currentUrl.origin) return false;
    if (url.pathname === currentUrl.pathname && url.search === currentUrl.search) return false;

    return true;
}


function easeInOutCubic(progress) {
    return progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - ((-2 * progress + 2) ** 3) / 2;
}

function smoothScrollToTarget(target) {
    const headerOffset = document.querySelector('.site-header')?.offsetHeight || 0;
    const start = window.scrollY;
    const targetTop = target.getBoundingClientRect().top + window.scrollY - headerOffset - 14;
    const distance = targetTop - start;
    const duration = Math.min(1500, Math.max(900, Math.abs(distance) * 0.9));
    const startTime = performance.now();

    function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        window.scrollTo(0, start + distance * easeInOutCubic(progress));

        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    }

    window.requestAnimationFrame(step);
}

document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || prefersReducedMotion) return;

    const target = document.querySelector(link.hash);
    if (!target) return;

    event.preventDefault();
    setMobileNav(false);
    smoothScrollToTarget(target);
    window.history.pushState(null, '', link.hash);
});

document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!shouldUsePageTransition(link, event)) return;

    event.preventDefault();
    setMobileNav(false);
    document.body.classList.add('is-page-leaving');

    window.setTimeout(() => {
        window.location.href = link.href;
    }, 220);
});

const revealTargets = document.querySelectorAll(
    '.top-info-section, .journal-section, .sdg-note-section, .feature-band, .flow-section, .tool-section, .resource-section, .wellness-marquee'
);

if (!prefersReducedMotion && 'IntersectionObserver' in window) {
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
