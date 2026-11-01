/**
 * Motion Ana Clara Nutri (GSAP 3.15, plugins gratuitos desde a 3.13).
 * Gramática da skill editorial-motion: entrada expo.out ~1s, stagger curto, saída mais rápida.
 *
 *  [data-reveal] / .reveal  entrada por scroll em lote; só para o que está ABAIXO da dobra
 *                           (o que já está na tela no load nunca é escondido: LCP intacto).
 *  [data-reveal-img]        imagem que se revela por máscara (clip-path) + leve zoom-out.
 *  [data-parallax]          deslocamento vertical suave com o scroll (valor = intensidade).
 *  [data-magnetic]          botão "puxado" pelo cursor (só ponteiro fino) e solto com elastic.
 *  [data-draw]              linha que se desenha (scaleX/scaleY) conforme o scroll.
 *  [data-steps]             passos que acendem em sequência.
 *  [data-progress]          barra de progresso de leitura (artigos).
 *
 * Só transform, opacity e clip-path (compositor).
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
const EXPO = 'expo.out';

function belowFold(els: Element[]) {
  const vh = window.innerHeight;
  return els.filter((el) => el.getBoundingClientRect().top > vh * 0.92) as HTMLElement[];
}

function reveals() {
  const pending = belowFold([...document.querySelectorAll('[data-reveal], .reveal')]);
  if (!pending.length) return;
  gsap.set(pending, { opacity: 0, y: 36 });
  ScrollTrigger.batch(pending, {
    start: 'top 90%',
    once: true,
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1, stagger: 0.07, ease: EXPO, overwrite: 'auto' }),
  });
}

function revealImages() {
  belowFold([...document.querySelectorAll('[data-reveal-img]')]).forEach((box) => {
    const img = box.querySelector('img');
    gsap.set(box, { clipPath: 'inset(12% 8% 12% 8% round 22px)' });
    if (img) gsap.set(img, { scale: 1.14 });
    ScrollTrigger.create({
      trigger: box, start: 'top 85%', once: true,
      onEnter: () => {
        gsap.to(box, { clipPath: 'inset(0% 0% 0% 0% round 22px)', duration: 1.3, ease: 'expo.inOut' });
        if (img) gsap.to(img, { scale: 1, duration: 1.6, ease: EXPO });
      },
    });
  });
}

function parallax() {
  document.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
    const amount = Number(el.dataset.parallax) || 10;
    gsap.fromTo(el, { yPercent: -amount / 2 }, {
      yPercent: amount / 2, ease: 'none',
      scrollTrigger: { trigger: el.parentElement ?? el, start: 'top bottom', end: 'bottom top', scrub: 0.4 },
    });
  });
}

function magnetic() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((btn) => {
    const zone = (btn.closest('.magnet-zone') as HTMLElement) ?? btn;
    const strength = Number(btn.dataset.magnetic) || 0.3;
    const xTo = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3.out' });
    const yTo = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3.out' });
    zone.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * strength);
      yTo((e.clientY - (r.top + r.height / 2)) * strength);
    });
    zone.addEventListener('mouseleave', () => gsap.to(btn, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.4)', overwrite: 'auto' }));
  });
}

function drawLines() {
  document.querySelectorAll<HTMLElement>('[data-draw]').forEach((line) => {
    const vertical = line.dataset.draw === 'y';
    gsap.fromTo(line, vertical ? { scaleY: 0 } : { scaleX: 0 }, {
      ...(vertical ? { scaleY: 1 } : { scaleX: 1 }), ease: 'none', transformOrigin: vertical ? 'center top' : 'left center',
      scrollTrigger: { trigger: line.parentElement ?? line, start: 'top 75%', end: 'bottom 60%', scrub: 0.6 },
    });
  });
}

function steps() {
  document.querySelectorAll<HTMLElement>('[data-steps]').forEach((list) => {
    const items = list.querySelectorAll<HTMLElement>('[data-step]');
    items.forEach((item) => {
      ScrollTrigger.create({
        trigger: item, start: 'top 70%', once: true,
        onEnter: () => item.classList.add('is-lit'),
      });
    });
  });
}

function progress() {
  const bar = document.querySelector<HTMLElement>('[data-progress]');
  const body = document.querySelector<HTMLElement>('[data-progress-target]');
  if (!bar || !body) return;
  gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: body, start: 'top top+=80', end: 'bottom bottom', scrub: 0.2 } });
}

export function initMotion() {
  document.documentElement.classList.add('js-motion');
  reveals();
  revealImages();
  parallax();
  magnetic();
  drawLines();
  steps();
  progress();
  // Fontes e imagens lazy mudam a altura da página depois do init.
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
}
