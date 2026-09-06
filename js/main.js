/* ══════════ TÉMA (světlé / tmavé) ══════════ */
const root = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  root.dataset.theme = savedTheme;
} else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
  root.dataset.theme = 'dark';
}
themeToggle.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', root.dataset.theme);
});

/* ══════════ JAZYK (CS / EN) ══════════ */
const langToggle = document.getElementById('langToggle');
let lang = localStorage.getItem('lang') || 'cs';

function applyLang() {
  document.querySelectorAll('[data-cs]').forEach(el => {
    const value = el.dataset[lang];
    if (value !== undefined) el.textContent = value;
  });
  document.documentElement.lang = lang;
  langToggle.textContent = lang === 'cs' ? 'EN' : 'CS';
  document.title = lang === 'cs'
    ? 'Jan Černý — Tester · Programátor · AI nadšenec'
    : 'Jan Černý — Tester · Developer · AI enthusiast';
}
langToggle.addEventListener('click', () => {
  lang = lang === 'cs' ? 'en' : 'cs';
  localStorage.setItem('lang', lang);
  applyLang();
});
applyLang();

/* ══════════ PSACÍ EFEKT V HLAVIČCE ══════════ */
const typed = document.getElementById('typed');
const VETY = {
  cs: ['testuju software', 'píšu v Pythonu', 'stavím AI agenty',
       'automatizuju testy', 'hledám chyby'],
  en: ['I test software', 'I write Python', 'I build AI agents',
       'I automate tests', 'I find bugs']
};
const bezPohybu = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let vetaIndex = 0, znakIndex = 0, mazu = false, timer = null;

function pisNext() {
  const vety = VETY[lang];
  const veta = vety[vetaIndex % vety.length];

  znakIndex += mazu ? -1 : 1;
  typed.textContent = veta.slice(0, znakIndex);

  let pauza = mazu ? 35 : 70;
  if (!mazu && znakIndex === veta.length) {
    pauza = 2200;            /* hotová věta chvíli zůstane */
    mazu = true;
  } else if (mazu && znakIndex === 0) {
    mazu = false;
    vetaIndex++;
    pauza = 320;
  }
  timer = setTimeout(pisNext, pauza);
}

function spustPsani() {
  clearTimeout(timer);
  znakIndex = 0; mazu = false;
  if (bezPohybu) {           /* kdo nechce animace, dostane rovnou text */
    typed.textContent = VETY[lang][0];
    return;
  }
  pisNext();
}
spustPsani();
langToggle.addEventListener('click', spustPsani);

/* ══════════ MOBILNÍ MENU ══════════ */
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
hamburger.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', open);
});
navLinks.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  })
);

/* ══════════ AKTIVNÍ ODKAZ V MENU ══════════ */
const sections = document.querySelectorAll('main section[id]');
const menuLinks = navLinks.querySelectorAll('a');
const activeObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      menuLinks.forEach(a =>
        a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id)
      );
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });
sections.forEach(s => activeObserver.observe(s));

/* ══════════ SCROLL REVEAL ══════════ */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ══════════ POČÍTADLA STATISTIK ══════════ */
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const statsObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const target = +el.dataset.count;
    statsObserver.unobserve(el);
    if (reducedMotion) { el.textContent = target + '+'; return; }
    const start = performance.now();
    (function tick(now) {
      const p = Math.min((now - start) / 1100, 1);
      /* u malých čísel nemá „+“ smysl — 2+ vypadá jako chyba */
      const pripona = el.dataset.suffix !== undefined ? el.dataset.suffix : '+';
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + pripona;
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  });
}, { threshold: 0.6 });
document.querySelectorAll('.stat .num').forEach(el => statsObserver.observe(el));

/* ══════════ LIGHTBOX GALERIE ══════════ */
const lightbox = document.getElementById('lightbox');
const lightboxContent = document.getElementById('lightboxContent');
const lightboxClose = document.getElementById('lightboxClose');
let lastFocused = null;

const lightboxTitle = document.getElementById('lightboxTitle');
const lightboxOpen = document.getElementById('lightboxOpen');
const lightboxCount = document.getElementById('lightboxCount');
const lightboxThumbs = document.getElementById('lightboxThumbs');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');

/* Všechny certifikáty tvoří jednu galerii, dá se v ní listovat. */
const certifikaty = [...document.querySelectorAll('.chip[data-img]')].map(chip => ({
  nazev: chip.textContent.trim(),
  obraz: chip.dataset.img,
  mini:  chip.dataset.mini,
  pdf:   chip.getAttribute('href'),
  prvek: chip
}));
let aktualni = 0;

lightboxThumbs.innerHTML = certifikaty.map((c, i) =>
  '<img src="' + c.mini + '" alt="' + c.nazev.replace(/"/g, '') + '" data-i="' + i + '" loading="lazy" />'
).join('');
const miniatury = [...lightboxThumbs.querySelectorAll('img')];

function ukaz(i) {
  aktualni = (i + certifikaty.length) % certifikaty.length;
  const c = certifikaty[aktualni];
  lightboxTitle.textContent = c.nazev;
  lightboxOpen.href = c.pdf;
  lightboxCount.textContent = (aktualni + 1) + ' / ' + certifikaty.length;
  lightboxContent.innerHTML = '<img src="' + c.obraz + '" alt="' + c.nazev.replace(/"/g, '') + '" />';
  miniatury.forEach((m, j) => m.classList.toggle('aktivni', j === aktualni));
  miniatury[aktualni].scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
}

certifikaty.forEach((c, i) => {
  c.prvek.addEventListener('click', e => {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    lastFocused = c.prvek;
    ukaz(i);
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    lightboxClose.focus();
  });
});

lightboxPrev.addEventListener('click', () => ukaz(aktualni - 1));
lightboxNext.addEventListener('click', () => ukaz(aktualni + 1));
lightboxThumbs.addEventListener('click', e => {
  if (e.target.dataset.i !== undefined) ukaz(Number(e.target.dataset.i));
});
document.addEventListener('keydown', e => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'ArrowLeft')  ukaz(aktualni - 1);
  if (e.key === 'ArrowRight') ukaz(aktualni + 1);
});
function closeLightbox() {
  lightbox.classList.remove('open');
  lightboxContent.innerHTML = '';   /* zastaví načítání PDF na pozadí */
  document.body.style.overflow = '';
  if (lastFocused) lastFocused.focus();
}
lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
});

/* ══════════ ROK VE FOOTERU ══════════ */
document.getElementById('year').textContent = new Date().getFullYear();
