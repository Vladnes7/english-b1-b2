/* Decoration is progressive: studying never depends on the motion runtime. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const hero = document.querySelector('.hero');
  let scene;
  const syncScene = () => {
    if (scene) { scene.destroy(); scene = null; }
    hero.querySelectorAll('[data-sc-parallax]').forEach(el => el.style.removeProperty('transform'));
    if (!reduced.matches && window.ScrollCraft) scene = ScrollCraft.mount(document.querySelector('.wrap'));
  };
  syncScene();
  reduced.addEventListener('change', syncScene);
  let pointerFrame = 0;
  hero.addEventListener('pointermove', event => {
    if (reduced.matches || !matchMedia('(pointer: fine)').matches) return;
    if (pointerFrame) cancelAnimationFrame(pointerFrame);
    pointerFrame = requestAnimationFrame(() => {
      const rect = hero.getBoundingClientRect();
      const amount = ((event.clientX - rect.left) / rect.width - .5) * 10;
      hero.style.setProperty('--studio-pointer', amount.toFixed(2));
      pointerFrame = 0;
    });
  });
  hero.addEventListener('pointerleave', () => {
    if (pointerFrame) cancelAnimationFrame(pointerFrame);
    pointerFrame = 0;
    hero.style.setProperty('--studio-pointer', '0');
  });

  // One-time reveals, including lesson content replaced by the existing app.
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08 });
  const enhance = () => {
    document.querySelectorAll('.italian-pause, #lessonExtra .sect-title, #lessonExtra .phr, #lessonExtra .gchip').forEach(el => {
      if (el.dataset.studioReveal) return;
      el.dataset.studioReveal = 'true';
      observer.observe(el);
    });
    document.querySelectorAll('#rows input[type="checkbox"]').forEach(el => {
      const word = el.closest('tr').querySelector('.en').textContent;
      el.setAttribute('aria-label', `Отметить слово «${word}» как выученное`);
    });
    document.querySelectorAll('#rows td.en').forEach(el => {
      el.tabIndex = 0;
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', `Подсказка к слову «${el.textContent}»`);
    });
    document.querySelectorAll('#mainTabs button, #subTabs button').forEach(el => {
      el.setAttribute('aria-pressed', String(el.classList.contains('active')));
    });
  };
  enhance();
  const mutations = new MutationObserver(enhance);
  mutations.observe(document.querySelector('#lessonExtra'), { childList: true, subtree: true });
  mutations.observe(document.querySelector('#rows'), { childList: true, subtree: true });
  mutations.observe(document.querySelector('#mainTabs'), { attributes: true, attributeFilter: ['class'], subtree: true });
  mutations.observe(document.querySelector('#subTabs'), { attributes: true, attributeFilter: ['class'], subtree: true });
  document.querySelector('#fcCard').addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.currentTarget.click(); }
  });
  document.querySelector('#rows').addEventListener('keydown', event => {
    if (event.target.matches('td.en') && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault(); event.target.click();
    }
  });
})();
