// theme: respect saved choice, else system preference
const root = document.documentElement;
const toggle = document.getElementById('themeToggle');
const stored = localStorage.getItem('theme');
const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
let theme = stored || (systemDark ? 'dark' : 'light');

function applyTheme(t) {
  theme = t;
  root.setAttribute('data-theme', t);
  toggle.setAttribute('aria-label', t === 'dark' ? 'switch to light mode' : 'switch to dark mode');
  localStorage.setItem('theme', t);
}

applyTheme(theme);

toggle.addEventListener('click', () => {
  applyTheme(theme === 'dark' ? 'light' : 'dark');
});

// inline "read more" expansions woven into the prose
document.querySelectorAll('.expand').forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.getElementById(link.dataset.target);
    const expanded = link.getAttribute('aria-expanded') === 'true';
    link.setAttribute('aria-expanded', String(!expanded));
    target.hidden = expanded;
  });
});
