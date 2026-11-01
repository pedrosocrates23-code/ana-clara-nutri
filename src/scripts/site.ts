/**
 * Comportamento global, carregado UMA vez no fim da página (depois do conteúdo e da foto do
 * hero, para não disputar o LCP). Header ao rolar, menu do celular, medição do WhatsApp e o
 * carregador do motion (GSAP sob demanda).
 */
import './menu';
import { bootMotion } from './motion-boot';

// Header: estado "rolado" (a logo sai e o "Início" entra na barra de vidro).
// Leitura do scrollY só dentro de requestAnimationFrame, uma vez por quadro (sem reflow forçado).
const header = document.querySelector<HTMLElement>('[data-header]');
const home = header?.querySelector<HTMLAnchorElement>('.glassbar__home');
if (header) {
  let scrolled: boolean | null = null;
  let queued = false;
  const update = () => {
    queued = false;
    const next = window.scrollY > 48;
    if (next === scrolled) return;
    scrolled = next;
    header.classList.toggle('is-scrolled', next);
    if (home) home.tabIndex = next ? 0 : -1;
  };
  const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

// Conversão = WhatsApp. Todo clique em link wa.me vira o evento GA4 `whatsapp_click`, com a
// seção de origem (data-wa-secao no link ou no ancestral mais próximo) e o caminho da página.
// No GA4, marque `whatsapp_click` como evento-chave para ver qual seção converte.
type Gtag = (...args: unknown[]) => void;
document.addEventListener('click', (e) => {
  const a = (e.target as HTMLElement).closest?.('a[href*="wa.me/"]') as HTMLAnchorElement | null;
  if (!a) return;
  const secao = a.dataset.waSecao
    ?? (a.closest('[data-wa-secao]') as HTMLElement | null)?.dataset.waSecao
    ?? (a.closest('.cta-artigo') ? 'Artigo · CTA no corpo' : 'Outro');
  const g = (window as unknown as { gtag?: Gtag }).gtag;
  g?.('event', 'whatsapp_click', { secao, page_path: location.pathname, transport_type: 'beacon' });
  const c = (window as unknown as { clarity?: Gtag }).clarity;
  c?.('event', 'whatsapp_click');
});

// Imagens adiadas (Picture.astro, loading="lazy"): o <img> vem em <noscript> e só é injetado
// perto da tela, depois da 1ª interação ou de ~1 s após o load. Assim nenhuma foto abaixo da
// dobra disputa banda com a foto principal (LCP). O wrapper é display:contents (não tem caixa),
// então quem é observado é o elemento pai (a moldura .media, que já reserva o espaço).
const adiadas = [...document.querySelectorAll<HTMLElement>('[data-dimg]')];
if (adiadas.length) {
  const injetar = (w: HTMLElement) => {
    const ns = w.querySelector('noscript');
    if (!ns) return;
    w.classList.add('is-injected');
    w.insertAdjacentHTML('beforeend', ns.textContent ?? '');
    ns.remove();
    const img = w.querySelector('img');
    const pronto = () => w.classList.add('is-loaded');
    if (!img || img.complete) requestAnimationFrame(pronto);
    else { img.addEventListener('load', pronto, { once: true }); img.addEventListener('error', pronto, { once: true }); }
  };
  let iniciou = false;
  const iniciar = () => {
    if (iniciou) return;
    iniciou = true;
    if (!('IntersectionObserver' in window)) { adiadas.forEach(injetar); return; }
    const alvo = new Map(adiadas.map((w) => [w.parentElement ?? w, w]));
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const w = alvo.get(e.target as HTMLElement);
        if (w) injetar(w);
        io.unobserve(e.target);
      }
    }, { rootMargin: '900px 0px' });
    alvo.forEach((_, el) => io.observe(el));
  };
  const evs = ['scroll', 'pointerdown', 'keydown', 'touchstart'];
  evs.forEach((t) => addEventListener(t, iniciar, { once: true, passive: true }));
  const depois = () => setTimeout(iniciar, 1000);
  if (document.readyState === 'complete') depois();
  else addEventListener('load', depois, { once: true });
}

bootMotion();
