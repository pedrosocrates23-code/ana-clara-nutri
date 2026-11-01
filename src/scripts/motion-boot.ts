/**
 * Carregador do motion. O GSAP (core + ScrollTrigger, ~46 KB gz) NÃO entra no caminho
 * crítico: só é importado na 1ª interação (rolar, tocar, tecla) ou 2,5 s depois do load,
 * o que vier antes. As animações são todas de conteúdo ABAIXO da dobra, então quem rola
 * dispara o carregamento antes de chegar nelas.
 * Sem JS, ou com prefers-reduced-motion, o site funciona igual, só sem movimento.
 */
export function bootMotion() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let started = false;
  const evs = ['scroll', 'pointerdown', 'keydown', 'touchstart'] as const;
  const start = () => {
    if (started) return;
    started = true;
    evs.forEach((t) => removeEventListener(t, start));
    import('./motion').then((m) => m.initMotion()).catch((err) => console.error('[motion]', err));
  };
  evs.forEach((t) => addEventListener(t, start, { once: true, passive: true }));
  const later = () => setTimeout(start, 2500);
  if (document.readyState === 'complete') later();
  else window.addEventListener('load', later, { once: true });
}
