# Formulários → Google Sheets

Os formulários do site gravam cada envio como uma **linha numa planilha do Google Sheets**.

Não há backend: o site continua 100% estático. O navegador envia um POST para um **Web App do Google Apps Script**, que é o que escreve na planilha. Sem servidor para manter, sem mensalidade e sem serviço de terceiros no meio.

```
Formulário no site  ──POST──►  Web App (Apps Script)  ──►  Planilha (Google Sheets)
```

**Onde os formulários aparecem:** no hero da home, na seção de agendamento do rodapé e na página `/contato`. Todos usam o mesmo componente (`src/components/FormCard.astro`), então configurar uma vez vale para todos.

**O que acontece depois do envio:** o formulário é substituído, no lugar, por uma confirmação ("Recebido, {nome}!"). A pessoa **não** é redirecionada para o WhatsApp — o contato dela já está gravado na planilha. O botão de WhatsApp da confirmação é um atalho opcional, e a mensagem já vai pré-preenchida dizendo que veio do formulário, com nome e modalidade. Assim a Ana abre a conversa sabendo que os dados já estão na planilha e não precisa pedir tudo de novo.

---

## Configuração (uma vez, ~5 minutos)

### 1. A planilha

Já existe: **[Leads do site](https://docs.google.com/spreadsheets/d/1yDkdB-gGBVasXw94-HLfi4dz6UixeNR5Js8H3lDHYGQ/edit)**.

O script grava na **primeira aba** e reaproveita o cabeçalho que já está lá. Na primeira execução ele acrescenta, à direita, as colunas que faltam (`Origem`, `Página`, `Consentimento LGPD`). Ele nunca renomeia nem reordena as colunas existentes.

### 2. Colar o script

1. Na planilha, menu **Extensões → Apps Script**.
2. Apague o conteúdo do arquivo `Código.gs` que abrir.
3. Cole todo o conteúdo de **`scripts/apps-script/Codigo.gs`** (deste repositório).
4. Salve (ícone de disquete).

### 3. Publicar o Web App

1. No editor do Apps Script, clique em **Implantar → Nova implantação**.
2. Em **Tipo**, escolha **App da Web**.
3. Configure:
   - **Executar como:** *Eu* (a conta dona da planilha)
   - **Quem pode acessar:** **Qualquer pessoa**
4. Clique em **Implantar**.
5. O Google vai pedir autorização. Aceite. (Vai aparecer um aviso de "app não verificado" — é o seu próprio script; clique em *Avançado → Acessar [nome do projeto]*.)
6. **Copie a URL do App da Web.** Ela termina em `/exec`.

> **Por que "Qualquer pessoa"?** É o navegador do visitante que envia o formulário, e ele não está logado no Google. Essa é a única configuração que funciona. O script só aceita gravar linhas — não expõe a planilha nem permite leitura.

### 4. Ligar o site ao endpoint

Crie o arquivo **`.env`** na raiz de `site/` (há um modelo em `.env.example`):

```bash
PUBLIC_SHEETS_ENDPOINT=https://script.google.com/macros/s/AKfy.../exec
```

Reinicie o dev server (`npm run dev`) para o Astro reler o `.env`.

> **No deploy (Vercel/Netlify):** cadastre `PUBLIC_SHEETS_ENDPOINT` nas variáveis de ambiente do projeto. O valor é embutido no HTML durante o build — não é segredo (o navegador precisa dele), mas o `.env` local fica fora do git.

### 5. Testar

Preencha o formulário em `/contato` e confira se a linha apareceu na planilha.

Para checar só se o Web App está de pé, abra a URL `/exec` no navegador: deve responder `{"ok":true,"servico":"anaclaranutri-forms"}`.

---

## Colunas gravadas

Na ordem exata da planilha. As 6 primeiras são as que a Ana já tinha; as 3 últimas o script acrescenta sozinho.

| Coluna | De onde vem |
|---|---|
| Data | Carimbo do servidor no momento do envio |
| Nome | campo `nome` |
| e-mail | campo `email` |
| WhatsApp | campo `telefone` (já com máscara, ex.: `(62) 99999-9999`) |
| Modelo de consulta | `Online (telenutrição)` ou `Presencial em Goiânia` |
| mensagem (se tiver) | campo `mensagem` (só existe no formulário de `/contato`) |
| **Origem** | sempre `Formulário do site` — separa o lead que preencheu o formulário daquele que chegou por outro caminho (WhatsApp direto, indicação, Instagram). É por aqui que a Ana filtra quem já tem ficha completa e pode cadastrar no sistema ao fechar negócio. |
| **Página** | a URL de onde a pessoa enviou (`/`, `/contato`, …) |
| **Consentimento LGPD** | `Sim` / `Não` |
| **Seção** | **qual** formulário converteu (veja abaixo) |

### Por que existem Página e Seção

A home tem **dois** formulários — o do hero e o da seção "Agendar", no rodapé. Os dois gravariam `Página = /`, então a URL sozinha não diz qual deles converteu. A coluna `Seção` resolve isso:

| Seção | Onde fica |
|---|---|
| `Home — hero (topo)` | primeira dobra da home, ao lado da chamada principal |
| `Home — seção Agendar (rodapé)` | faixa verde no fim da home |
| `Página de contato` | `/contato` (é o único com campo de mensagem) |

Com isso dá para responder "o formulário do topo converte mais que o do rodapé?" filtrando a coluna `Seção`.

O rótulo vem da prop `secao` do componente `FormCard`. Ao adicionar um formulário novo em qualquer página, passe um rótulo: `<FormCard idPrefix="x" secao="Nome legível da seção" />`. Sem isso, a coluna cai no `idPrefix`, que é técnico e pouco legível.

> **Ao mexer nas colunas:** as linhas são gravadas **por posição**. Coluna nova só pode ser acrescentada no **fim** da lista `COLUNAS` do script. Inserir no meio desalinha todas as linhas antigas.

---

## Anti-spam

O formulário tem um **honeypot**: um campo `website` invisível para pessoas. Bots costumam preencher tudo. Se ele vier preenchido, o envio é descartado silenciosamente — o site finge sucesso e nada é gravado.

Sem CAPTCHA de propósito: além de atritar a conversão, o Código de Ética não impede, mas o formulário de um profissional de saúde deve ser o mais simples possível.

---

## Se der problema

| Sintoma | Causa provável |
|---|---|
| "Formulário ainda não configurado" | `PUBLIC_SHEETS_ENDPOINT` vazio. Falta o `.env` (local) ou a variável de ambiente (deploy). |
| Envio "dá certo" mas nada aparece na planilha | A implantação foi feita com **Quem pode acessar: apenas eu**. Refaça com **Qualquer pessoa**. |
| Parou de gravar depois de editar o script | Toda alteração exige **Implantar → Gerenciar implantações → Editar → Nova versão**. Sem isso, a URL continua servindo o código antigo. |
| Linhas duplicadas | Duplo clique no botão. O botão já é desabilitado durante o envio; se persistir, verificar. |

---

## LGPD

A planilha guarda **dados pessoais** (nome, e-mail, telefone) e o site coleta consentimento explícito no formulário, com link para a Política de Privacidade.

Portanto:

- **Não compartilhe a planilha publicamente** nem por link aberto. Só a Ana (e quem precisar operar) deve ter acesso.
- O art. 23 da Resolução CFN nº 856/2026 e a LGPD (Lei nº 13.709/2018) impõem sigilo e segurança sobre esses dados.
- A coluna *Consentimento LGPD* existe para provar que o titular autorizou o contato. Não apague o histórico.
