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

bootMotion();
