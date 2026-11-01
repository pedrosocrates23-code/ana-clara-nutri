/**
 * Menu do celular/tablet (padrão "timeline .clear() and rebuild" do vídeo de referência).
 *  - UMA timeline, limpa e reconstruída a cada abertura/fechamento (tl.clear()).
 *  - Entrada com fromTo (sempre parte de um estado conhecido): painéis entram pela direita
 *    em sequência, links sobem um a um, o hambúrguer vira X com mola elástica (vídeo radial).
 *  - Saída com to (continua de onde a animação estiver): os painéis voltam juntos para a
 *    direita, o caminho inverso da entrada (sem queda), e o X volta a ser hambúrguer.
 * O GSAP é importado sob demanda no 1º toque. Com prefers-reduced-motion, abre e fecha sem animação.
 */
import type { gsap as GsapNS } from 'gsap';
type Gsap = typeof GsapNS;

const root = document.querySelector<HTMLElement>('[data-mnav]');
const burger = document.querySelector<HTMLButtonElement>('[data-burger]');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let gs: Gsap | null = null;
let tl: ReturnType<Gsap['timeline']> | null = null;
let isOpen = false;

async function getGsap() {
  if (!gs) gs = (await import('gsap')).gsap;
  return gs;
}

function setState(next: boolean) {
  isOpen = next;
  burger?.setAttribute('aria-expanded', String(next));
  burger?.setAttribute('aria-label', next ? 'Fechar menu' : 'Abrir menu');
  document.documentElement.classList.toggle('nav-open', next);
  document.querySelector('[data-header]')?.classList.toggle('is-open', next);
}

async function openMenu() {
  if (!root || !burger) return;
  setState(true);
  root.hidden = false;
  const panels = root.querySelectorAll<HTMLElement>('[data-mnav-panel]');
  const links = root.querySelectorAll<HTMLElement>('[data-mnav-link]');
  const backdrop = root.querySelector<HTMLElement>('[data-mnav-backdrop]');
  const [l1, l2, l3] = burger.querySelectorAll<HTMLElement>('[data-bar]');
  if (reduce) { links[0]?.focus(); return; }
  const g = await getGsap();
  tl ??= g.timeline();
  tl.clear()
    .fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power1.out' }, 0)
    .fromTo(panels, { xPercent: 110 }, { xPercent: 0, duration: 0.7, ease: 'power4.out', stagger: 0.08 }, 0)
    .fromTo(links, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: 'power3.out', stagger: 0.05 }, 0.18)
    .to(l1, { y: 6, rotation: 45, duration: 0.6, ease: 'elastic.out(1, 0.5)' }, 0)
    .to(l2, { scaleX: 0, opacity: 0, duration: 0.2 }, 0)
    .to(l3, { y: -6, rotation: -45, duration: 0.6, ease: 'elastic.out(1, 0.5)' }, 0)
    .play(0);
  links[0]?.focus({ preventScroll: true });
}

async function closeMenu(returnFocus = true) {
  if (!root || !burger || !isOpen) return;
  setState(false);
  const panels = root.querySelectorAll<HTMLElement>('[data-mnav-panel]');
  const backdrop = root.querySelector<HTMLElement>('[data-mnav-backdrop]');
  const [l1, l2, l3] = burger.querySelectorAll<HTMLElement>('[data-bar]');
  if (returnFocus) burger.focus();
  if (reduce) { root.hidden = true; return; }
  const g = await getGsap();
  tl ??= g.timeline();
  tl.clear()
    // Saída = o caminho inverso da entrada: os painéis voltam juntos para a direita.
    .to(panels, { xPercent: 110, duration: 0.5, ease: 'power3.in', stagger: { each: 0.05, from: 'end' } }, 0)
    .to(backdrop, { opacity: 0, duration: 0.35, ease: 'power1.in' }, 0.1)
    .to([l1, l3], { y: 0, rotation: 0, duration: 0.6, ease: 'elastic.out(1, 0.5)' }, 0)
    .to(l2, { scaleX: 1, opacity: 1, duration: 0.3 }, 0.1)
    .add(() => { root.hidden = true; })
    .play(0);
}

burger?.addEventListener('click', () => (isOpen ? closeMenu() : openMenu()));
root?.querySelector('[data-mnav-backdrop]')?.addEventListener('click', () => closeMenu());
root?.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => closeMenu(false)));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen) closeMenu(); });
// Voltou para o desktop com o menu aberto: fecha sem animação.
window.matchMedia('(min-width: 1081px)').addEventListener('change', (m) => {
  if (m.matches && isOpen) { setState(false); if (root) root.hidden = true; }
});
