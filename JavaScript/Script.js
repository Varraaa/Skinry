/**
 * SKINRY – Script.js (Upgraded v2)
 */
'use strict';

/* ============================================================
   1. SECTION NAVIGATION (Navbar desktop + Mobile hamburger)
   ------------------------------------------------------------
   - Satu sumber kebenaran untuk: scroll ke section yang benar,
     menutup mobile menu, dan menandai link aktif (bold) — baik
     untuk nav desktop maupun mobile.
   - Tinggi acuan offset scroll memakai `.nav-inner` (BUKAN
     `#navbar` yang juga membungkus `.mobile-menu`). Ini memperbaiki
     bug lama: saat mobile-menu sedang collapse, offsetHeight
     navbar ikut "menggelembung" sesaat sehingga hasil scroll
     mendarat tidak tepat di section yang dituju.
   ============================================================ */
(function initSectionNav() {
    const navbar = document.getElementById('navbar');
    const navInner = document.querySelector('.nav-inner');
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    const sectionLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
    const sections = document.querySelectorAll('main section[id]');

    if (!navbar || !navInner) return;

    let isClickScrolling = false;
    let resumeTimer = null;

    function getNavOffset() {
        // Selalu pakai tinggi nav-inner (68/64/80px) — stabil,
        // tidak terpengaruh status buka/tutup mobile-menu.
        return navInner.offsetHeight;
    }

    function setActiveSection(sectionId) {
        sectionLinks.forEach((link) => {
            const isActive = link.getAttribute('data-section') === sectionId;
            link.classList.toggle('active', isActive);
            if (isActive) link.setAttribute('aria-current', 'page');
            else link.removeAttribute('aria-current');
        });

        // Footer quick-links juga ikut menandai aktif (opsional, konsisten)
        document.querySelectorAll('.footer-link[data-section]').forEach((link) => {
            link.classList.toggle('active', link.getAttribute('data-section') === sectionId);
        });
    }

    function openMobileMenu() {
        if (!hamburger || !mobileMenu) return;
        hamburger.classList.add('open');
        mobileMenu.classList.add('open');
        hamburger.setAttribute('aria-expanded', 'true');
    }

    function closeMobileMenu() {
        if (!hamburger || !mobileMenu) return;
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
    }

    function scrollToSection(hash) {
        const target = document.querySelector(hash);
        if (!target) return;
        const navOffset = getNavOffset();
        const top = target.getBoundingClientRect().top + window.scrollY - navOffset - 4;
        window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
    }

    /* Klik pada menu navigasi (desktop & mobile) */
    sectionLinks.forEach((link) => {
        link.addEventListener('click', function (e) {
            const hash = this.getAttribute('href');
            const sectionId = this.getAttribute('data-section');
            if (!hash || hash.charAt(0) !== '#' || !sectionId) return;

            e.preventDefault();

            // 1) Tutup mobile menu dahulu (jika sedang terbuka)
            closeMobileMenu();

            // 2) Set status aktif/bold SEKETIKA saat diklik
            setActiveSection(sectionId);

            // 3) Update URL tanpa reload
            history.pushState(null, '', hash);

            // 4) Scroll halus ke section yang benar
            isClickScrolling = true;
            scrollToSection(hash);

            clearTimeout(resumeTimer);
            resumeTimer = setTimeout(() => { isClickScrolling = false; }, 800);
        });
    });

    /* Toggle hamburger */
    hamburger?.addEventListener('click', () => {
        hamburger.classList.contains('open') ? closeMobileMenu() : openMobileMenu();
    });

    /* Tutup menu dengan tombol Escape */
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && hamburger?.classList.contains('open')) {
            closeMobileMenu();
            hamburger.focus();
        }
    });

    /* Tutup menu saat klik di luar area menu */
    document.addEventListener('click', (e) => {
        if (!mobileMenu || !hamburger) return;
        const clickedOutside = !mobileMenu.contains(e.target) && !hamburger.contains(e.target);
        if (clickedOutside && mobileMenu.classList.contains('open')) {
            closeMobileMenu();
        }
    });

    /* Tutup menu otomatis saat resize ke layar desktop */
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) closeMobileMenu();
    }, { passive: true });

    /* Update navbar "scrolled" style + active link berdasarkan posisi scroll */
    function onScroll() {
        navbar.classList.toggle('scrolled', window.scrollY > 48);

        // Saat baru saja klik menu, biarkan scroll selesai dulu
        // agar tidak "berebut" status aktif dengan deteksi otomatis.
        if (isClickScrolling) return;

        let current = '';
        const navOffset = getNavOffset();
        sections.forEach((sec) => {
            const top = sec.offsetTop - navOffset - 40;
            if (window.scrollY >= top) current = sec.getAttribute('id');
        });

        if (current) setActiveSection(current);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
})();


/* ============================================================
   2. SMOOTH SCROLL untuk anchor lain (logo, footer link, CTA, dll)
   ------------------------------------------------------------
   Nav-link & mobile-nav-link sudah ditangani khusus di atas,
   sehingga di sini cukup tangani anchor selain keduanya
   (mis. logo navbar/footer, tombol "Collection" di Hero,
   footer quick-links) — tetap memakai acuan tinggi nav-inner.
   ============================================================ */
(function initGenericAnchorScroll() {
    const navInner = document.querySelector('.nav-inner');

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        if (anchor.classList.contains('nav-link') || anchor.classList.contains('mobile-nav-link')) return;

        anchor.addEventListener('click', function (e) {
            const id = this.getAttribute('href');
            if (!id || id === '#') return;
            const target = document.querySelector(id);
            if (!target) return;

            e.preventDefault();
            const navOffset = navInner ? navInner.offsetHeight : 80;
            const top = target.getBoundingClientRect().top + window.scrollY - navOffset - 4;
            window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
            history.pushState(null, '', id);
        });
    });
})();


/* ============================================================
   3. SCROLL REVEAL
   ============================================================ */
(function initScrollReveal() {
    const els = document.querySelectorAll('.scroll-reveal');
    if (!els.length) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        els.forEach((el) => el.classList.add('visible'));
        return;
    }

    const obs = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
            if (e.isIntersecting) {
                e.target.classList.add('visible');
                obs.unobserve(e.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -48px 0px' });

    els.forEach((el) => obs.observe(el));
})();


/* ============================================================
   4. CAROUSEL – 8 reviews, left/right, dots, swipe, autoplay
   ============================================================ */
const TOTAL_SLIDES = 8;
let currentSlide = 0;
let autoplayTimer = null;

(function buildDots() {
    const container = document.getElementById('carousel-dots');
    if (!container) return;
    for (let i = 0; i < TOTAL_SLIDES; i++) {
        const dot = document.createElement('button');
        dot.className = 'dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
        dot.setAttribute('aria-label', 'Slide ' + (i + 1));
        dot.setAttribute('data-index', i);
        dot.addEventListener('click', () => goToSlide(i));
        dot.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goToSlide(i); }
        });
        container.appendChild(dot);
    }
})();

function moveCarousel(dir) {
    goToSlide((currentSlide + dir + TOTAL_SLIDES) % TOTAL_SLIDES);
}

function goToSlide(index) {
    currentSlide = index;
    const track = document.getElementById('carousel-track');
    const dots = document.querySelectorAll('.dot');
    if (!track) return;

    track.style.transform = `translateX(-${currentSlide * 100}%)`;

    dots.forEach((dot, i) => {
        const active = i === currentSlide;
        dot.classList.toggle('active', active);
        dot.setAttribute('aria-selected', active ? 'true' : 'false');
    });
}

function startAutoplay() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    stopAutoplay();
    autoplayTimer = setInterval(() => moveCarousel(1), 5000);
}
function stopAutoplay() {
    if (autoplayTimer) clearInterval(autoplayTimer);
}

(function initAutoplay() {
    startAutoplay();
    const wrapper = document.querySelector('.carousel-wrapper');
    if (!wrapper) return;
    wrapper.addEventListener('mouseenter', stopAutoplay);
    wrapper.addEventListener('focusin', stopAutoplay);
    wrapper.addEventListener('mouseleave', startAutoplay);
    wrapper.addEventListener('focusout', (e) => {
        if (!wrapper.contains(e.relatedTarget)) startAutoplay();
    });
})();

(function initSwipe() {
    const track = document.getElementById('carousel-track');
    if (!track) return;
    let startX = 0;
    track.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) > 48) moveCarousel(dx < 0 ? 1 : -1);
    }, { passive: true });
})();


/* ============================================================
   5. BACK TO TOP
   ============================================================ */
(function initBackToTop() {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;
    window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();


/* ============================================================
   6. NEWSLETTER FORM
   ============================================================ */
function handleNewsletter(event) {
    event.preventDefault();
    const input = document.getElementById('newsletter-email');
    const email = input?.value?.trim();
    const btn = event.target.querySelector('.newsletter-btn');
    if (!email || !btn) return;

    const icon = btn.querySelector('.material-symbols-outlined');
    if (icon) {
        icon.textContent = 'check';
        btn.style.backgroundColor = '#4caf50';
        setTimeout(() => {
            icon.textContent = 'arrow_forward';
            btn.style.backgroundColor = '';
            input.value = '';
        }, 2500);
    }
    console.log('Newsletter subscription:', email);
}


/* ============================================================
   7. PRODUCT CARD – View Detail
   ============================================================ */
(function initProductCards() {
    document.querySelectorAll('.btn-text').forEach((btn) => {
        btn.addEventListener('click', function () {
            const name = this.closest('.product-card')?.querySelector('.product-name')?.textContent;
            if (name) console.log('View detail:', name);
        });
    });
})();


/* ============================================================
   8. KEYBOARD NAV HELPER (accessibility)
   ============================================================ */
document.addEventListener('keydown', () => document.body.classList.add('keyboard-nav'));
document.addEventListener('mousedown', () => document.body.classList.remove('keyboard-nav'));