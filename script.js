/* ============ SCROLL TRACKING & PROGRESS ============ */
const progressBar = document.getElementById('progress-bar');
const scrollIndicator = document.getElementById('scroll-indicator');
const sections = document.querySelectorAll('.section');
const dots = document.querySelectorAll('.scroll-indicator .dot');

window.addEventListener('scroll', () => {
  // progress bar
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const scrollPercent = (scrollTop / docHeight) * 100;
  progressBar.style.width = scrollPercent + '%';

  // active section detection
  let current = 0;
  sections.forEach((section, i) => {
    const rect = section.getBoundingClientRect();
    if (rect.top <= window.innerHeight * 0.5) {
      current = i;
    }
  });

  // update dots
  document.querySelectorAll('#scroll-indicator .dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === current);
  });
});

/* ============ SCROLL INDICATOR CLICKS ============ */
document.querySelectorAll('#scroll-indicator .dot').forEach((dot) => {
  dot.addEventListener('click', (e) => {
    const sec = e.target.dataset.sec;
    const section = document.getElementById(`sec-${sec}`);
    section?.scrollIntoView({ behavior: 'smooth' });
  });
});

/* ============ SKILL BAR ANIMATIONS ON SCROLL ============ */
const observerOptions = {
  threshold: 0.3,
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const fills = entry.target.querySelectorAll('.skill-fill');
      fills.forEach((fill) => {
        const w = fill.dataset.w;
        fill.style.width = w;
      });
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll('.skills-grid').forEach((grid) => {
  observer.observe(grid);
});