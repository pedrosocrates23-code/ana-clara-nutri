// Fontes do banner da home, compartilhadas entre o <picture> do Hero e o preload no <head>
// (os dois precisam pedir exatamente o mesmo arquivo, senão o preload vira download duplo).
import manifest from '../data/images.json';

type Entry = { width: number; height: number; widths: number[] };
const m = manifest as Record<string, Entry>;
const set = (name: string, e: Entry) => e.widths.map((w) => `/img/${name}-${w}.webp ${w}w`).join(', ');

export function heroSources() {
  const d = m['hero-home'];
  const mb = m['hero-home-mobile'];
  return {
    desk: d && { src: `/img/hero-home-1920.webp`, srcset: set('hero-home', d), sizes: '100vw', width: d.width, height: d.height },
    // No celular o recorte 3:4 ocupa ~0,75 x a altura da tela; 70vw leva o celular comum (DPR 3)
    // à versão de 960px: densidade ~1,5x sob o degradê, com metade do peso da de 1240px.
    mob: mb && { srcset: set('hero-home-mobile', mb), sizes: '70vw', width: mb.width, height: mb.height },
  };
}
