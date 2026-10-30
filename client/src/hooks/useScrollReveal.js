import { useEffect } from 'react';

/**
 * Revela con animación los elementos marcados con data-reveal cuando entran en pantalla.
 * Si el usuario prefiere menos movimiento (o el navegador no soporta
 * IntersectionObserver), todo se muestra directamente.
 * Retraso opcional por elemento: style={{ '--d': 2 }} → 2 × 80 ms.
 */
export function useScrollReveal() {
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) return undefined;

    const root = document.documentElement;
    root.classList.add('reveal-ready');

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    );

    const observeAll = () => {
      document.querySelectorAll('[data-reveal]:not(.is-visible)').forEach((el) => io.observe(el));
    };
    observeAll();

    // Las pantallas cambian sin recargar: observa también los elementos nuevos.
    const mo = new MutationObserver(observeAll);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      root.classList.remove('reveal-ready');
    };
  }, []);
}
