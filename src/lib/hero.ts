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
    // Celular: recorte quadrado no topo do hero (~62% da altura da tela). 75vw leva o celular de
    // densidade 3 à versão de 960px e o de densidade ~1,75 à de 560px (a leve suavização fica
    // sob o degradê), mantendo o LCP no 4G abaixo de 1,8 s (PageSpeed 100).
    mob: mb && { srcset: set('hero-home-mobile', mb), sizes: '75vw', width: mb.width, height: mb.height },
  };
}
