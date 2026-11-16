const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const animations = new Set();
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver(entries => {
    for (const {target, isIntersecting} of entries) {
      if (!isIntersecting) continue;
      observer.unobserve(target);
      if (reducedMotion.matches) continue;
      const animation = target.animate([
        {opacity: .35, transform: 'translateY(24px)'}, {opacity: 1, transform: 'translateY(0)'}
      ], {duration: 650, easing: 'cubic-bezier(.16,1,.3,1)'});
      animations.add(animation); animation.finished.finally(() => animations.delete(animation)).catch(() => {});
    }
  }, {threshold: .08});
  document.querySelectorAll('.workbench,.maker,.notes,.after-party,main>.info-page').forEach(el => observer.observe(el));
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) { observer.disconnect(); for (const animation of animations) animation.cancel(); }
  });
}
