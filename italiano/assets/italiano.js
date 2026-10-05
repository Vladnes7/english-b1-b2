/* Decoration is progressive: studying never depends on the motion runtime. */
(() => {
  const hero = document.querySelector('.hero');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
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
  const enhance = (root = document) => {
    root.querySelectorAll('.italian-pause, #lessonExtra .sect-title, #lessonExtra .phr, #lessonExtra .gchip').forEach(el => {
      if (el.dataset.studioReveal) return;
      el.dataset.studioReveal = 'true';
      observer.observe(el);
    });
  };
  const syncTabs = () => {
    document.querySelectorAll('#mainTabs button, #subTabs button').forEach(el => {
      const pressed = String(el.classList.contains('active'));
      if(el.getAttribute('aria-pressed') !== pressed) el.setAttribute('aria-pressed', pressed);
    });
  };
  enhance();
  syncTabs();
  // Only revisit the container whose content changed.
  const contentObserver = new MutationObserver(records => {
    const roots = new Set(records.map(record => record.target.closest('#lessonExtra, #rows')));
    roots.forEach(root => { if(root) enhance(root); });
  });
  ['lessonExtra', 'rows'].forEach(id => {
    contentObserver.observe(document.getElementById(id), {childList:true, subtree:true});
  });
  const tabObserver = new MutationObserver(syncTabs);
  ['mainTabs', 'subTabs'].forEach(id => {
    tabObserver.observe(document.getElementById(id), {attributes:true, attributeFilter:['class'], subtree:true});
  });
  document.querySelector('#fcCard').addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.currentTarget.click(); }
  });
})();
