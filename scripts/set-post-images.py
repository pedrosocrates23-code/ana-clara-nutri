# Grava `image` e `imageAlt` no frontmatter de cada post (redesign 01/11/2026).
# As capas foram geradas pelo Codex (sem pessoas, sem texto, sem marca: CFN 856/2026
# arts. 38 e 69) e convertidas por scripts/build-images.mjs. O alt descreve o que a
# imagem MOSTRA de fato (conferido imagem a imagem), não o tema do artigo.
import re, sys, pathlib
sys.stdout.reconfigure(encoding='utf-8')
POSTS = pathlib.Path('src/content/posts')

ALT = {
 'abordagens-em-nutricao-glossario': 'Caderno aberto em branco sobre mesa de madeira, cercado de tigelas com lentilha, frutas vermelhas, castanhas, folhas verdes e abacate',
 'acompanhamento-nutricional-x-dieta': 'Caminho de pedras atravessando uma horta com ervas e hortaliças sob a luz da manhã',
 'alimentacao-e-sop-por-onde-comecar': 'Mesa de café da manhã com torradas com abacate e ovo, tigela de frutas vermelhas, xícara de chá e vaso de flores cor-de-rosa',
 'alimentos-ricos-em-fibras': 'Tigelas de cerâmica com aveia, grão-de-bico, lentilha, feijão-preto, chia, brócolis, peras, maçãs e batata-doce',
 'colesterol-alto-o-que-a-alimentacao-pode-ajudar': 'Azeite em galheteiro de vidro, nozes, aveia, abacate, filé de salmão, folhas verdes e limão sobre pedra e linho',
 'como-comecar-uma-reeducacao-alimentar': 'Cesta de palha cheia de verduras, legumes e frutas recém-chegada sobre a bancada da cozinha',
 'como-melhorar-a-alimentacao-em-casa': 'Panela de sopa no fogão, legumes picados na tábua, tigela de arroz e vasos de ervas na janela da cozinha',
 'como-pouco-e-nao-emagreco': 'Prato pequeno com poucas folhas e um copo vazio sobre uma mesa grande de madeira',
 'como-saber-em-quem-confiar-em-nutricao': 'Lupa sobre uma folha em branco ao lado de uma tigela de frutas e uma xícara de chá',
 'como-saber-se-nutricionista-e-bom': 'Escrivaninha organizada com fruteira de maçãs, jarra de água, caderno fechado e caneta, com um quadro em branco na parede',
 'como-um-nutricionista-avalia-alimentacao': 'Caderno de registro alimentar em branco cercado por pratos com as refeições de um dia: café da manhã, almoço, lanche e jantar',
 'compulsao-alimentar-como-parar': 'Cozinha ao entardecer com uma tigela de sopa quente na mesa, vela acesa e manta dobrada na cadeira',
 'dieta-feita-por-ia-o-que-fazer': 'Folha impressa com uma grade de cardápio vazia ao lado de uma tigela colorida de comida caseira',
 'diferenca-entre-nutricionista-e-nutrologo': 'Tigela de alimentos frescos ao lado de uma pasta de couro verde com um estetoscópio sobre a mesa',
 'especialidade-em-nutricao-o-que-o-cfn-reconhece': 'Fileira de livros de capa dura sem título numa prateleira de madeira com planta e fruteira',
 'exames-alterados-quando-procurar-nutricionista': 'Envelope branco fechado ao lado de uma tigela de legumes, copo de água e óculos de leitura',
 'ferritina-baixa-o-que-muda-na-mesa': 'Alimentos fonte de ferro: feijão, lentilha, folhas verde-escuras, carne na frigideira de ferro e sementes de abóbora, com laranja e limão',
 'glicemia-de-jejum-alterada-o-que-comer': 'Prato de café da manhã com ovos, pão integral, queijo, tomates e rúcula, tigela de frutas vermelhas e caneca de café',
 'intestino-preso-o-que-a-alimentacao-pode-fazer': 'Jarra e copo de água, tigela com mamão, ameixa-preta, aveia e linhaça e folhas verdes numa mesa ensolarada',
 'microbiota-intestinal-o-que-e-e-como-cuidar': 'Muitas tigelas pequenas com frutas, feijões, grãos, castanhas, sementes e legumes de várias cores, e um pote de kefir',
 'nutricionista-esportivo-em-goiania': 'Banco de praça com bolsa de treino, garrafa de água, banana e marmita de arroz com frango sob ipês-amarelos ao entardecer',
 'nutricionista-online-vale-a-pena': 'Notebook fechado na mesa da cozinha ao lado de uma tigela de salada e uma xícara de chá',
 'nutricionista-sem-dieta-restritiva': 'Mesa farta com salada, legumes assados, grãos, frutas e uma fatia de bolo em louças artesanais',
 'o-que-faz-um-nutricionista': 'Sala clara com mesa de madeira, fruteira, caderno aberto e cadeiras estofadas',
 'o-que-nao-atendo': 'Porta aberta para um jardim iluminado, com aparador e vaso de planta ao lado',
 'online-ou-presencial': 'Mesa de madeira com um notebook fechado e uma xícara de um lado e uma poltrona vazia do outro, sob luz natural',
 'por-que-nao-consigo-seguir-a-dieta': 'Folha de papel amassada ao lado de um prato de comida caseira e um garfo sobre a mesa',
 'por-que-sinto-fome-o-tempo-todo': 'Geladeira aberta à noite com alimentos frescos em potes de vidro, iluminando a cozinha escura',
 'pre-e-pos-treino-o-que-comer': 'Tábua com banana, aveia e mel de um lado e tigela de arroz, ovos e verduras do outro, com garrafa de água',
 'primeira-consulta': 'Canto de recepção com poltrona de linho, mesinha redonda com jarra de água, copo e caderno',
 'proteina-e-treino': 'Alimentos ricos em proteína sobre a mesa: ovos, frango grelhado, peixe, feijão, lentilha, iogurte, tofu e ricota',
 'psicologo-ou-nutricionista-ansiedade': 'Duas poltronas de linho voltadas uma para a outra, com mesinha de madeira, xícara de chá e fruteira',
 'quais-dietas-um-nutricionista-recomenda': 'Pilha de livros de capa lisa ao lado de um prato equilibrado com salmão, grãos e legumes',
 'quais-problemas-um-nutricionista-resolve': 'Tigelas de cerâmica enfileiradas sobre linho, cada uma com um alimento diferente, vistas de cima',
 'quando-procurar-um-nutricionista': 'Calendário de parede em branco ao fundo de uma fruteira e uma xícara sobre a mesa ensolarada',
 'quando-um-problema-alimentar-e-grave': 'Poltrona vazia junto a uma janela ampla, com mesinha e copo de água, em luz suave',
 'vale-a-pena-pagar-nutricionista-emagrecer': 'Prateleira de cozinha com potes de grãos, cesta de hortaliças, utensílios de madeira e um livro de capa lisa',
 'vontade-de-doce-a-noite': 'Mesinha ao lado do sofá com tigela de morangos e um quadrado de chocolate amargo, sob a luz de um abajur à noite',
}

def main():
    feitos, faltam = 0, []
    for f in sorted(POSTS.glob('*.md')):
        slug = f.stem
        if slug not in ALT:
            faltam.append(slug); continue
        txt = f.read_text(encoding='utf-8')
        fm_end = txt.index('\n---', 4)
        fm, body = txt[:fm_end], txt[fm_end:]
        fm = re.sub(r'^image:.*\n?', '', fm, flags=re.M)
        fm = re.sub(r'^imageAlt:.*\n?', '', fm, flags=re.M)
        linhas = fm.split('\n')
        i = next(k for k, l in enumerate(linhas) if l.startswith('medical:') or l.startswith('datePublished:'))
        # insere logo depois de medical (ou datePublished/dateModified)
        j = max(k for k, l in enumerate(linhas) if re.match(r'^(medical|datePublished|dateModified):', l))
        linhas[j+1:j+1] = [f'image: "/blog/{slug}.webp"', f'imageAlt: "{ALT[slug]}"']
        f.write_text('\n'.join(linhas) + body, encoding='utf-8', newline='\n')
        feitos += 1
    print(f'{feitos} posts atualizados; sem alt definido: {faltam or "nenhum"}')

if __name__ == '__main__':
    main()
