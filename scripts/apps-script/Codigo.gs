/**
 * Recebe os formulários do site anaclaranutri e grava cada envio como uma linha
 * na planilha do Google Sheets.
 *
 * Este arquivo NÃO roda no site. Ele é colado no editor do Google Apps Script,
 * vinculado à planilha. Passo a passo: docs/FORMULARIOS-GOOGLE-SHEETS.md
 *
 * Planilha de destino:
 * https://docs.google.com/spreadsheets/d/1yDkdB-gGBVasXw94-HLfi4dz6UixeNR5Js8H3lDHYGQ/edit
 *
 * Dados pessoais (LGPD): a planilha guarda nome, e-mail e telefone. Mantenha o
 * compartilhamento restrito e não a torne pública.
 */

/**
 * Colunas gravadas, na ordem exata da planilha.
 *
 * As 6 primeiras já existiam na planilha da Ana e foram mantidas com o nome
 * original. As 3 últimas são acrescentadas pelo script na primeira execução:
 *   - Origem: separa lead vindo do formulário de lead que chegou por outro caminho;
 *   - Página: de onde a pessoa enviou (/, /contato, ...), mostra o que converte;
 *   - Consentimento LGPD: prova de que o titular autorizou o contato (Lei 13.709/2018);
 *   - Seção: QUAL formulário converteu. A home tem dois (hero e rodapé) e os dois
 *     gravariam Página = "/", então só a URL não distingue um do outro.
 *
 * ATENÇÃO ao editar: as linhas são gravadas por POSIÇÃO. Colunas novas só podem ser
 * acrescentadas no FIM da lista. Inserir no meio desalinha todas as linhas antigas.
 */
var COLUNAS = [
  'Data',
  'Nome',
  'e-mail',
  'WhatsApp',
  'Modelo de consulta',
  'mensagem (se tiver)',
  'Origem',
  'Página',
  'Consentimento LGPD',
  'Seção',
];

var ORIGEM_FORMULARIO = 'Formulário do site';

function doPost(e) {
  try {
    var p = (e && e.parameter) || {};

    // Honeypot: se veio preenchido, é bot. Responde 200 para não dar pista e ignora.
    if (p.website) {
      return json({ ok: true });
    }

    // Sem nome e sem contato não há lead: evita linhas vazias por requisição solta.
    if (!p.nome || (!p.email && !p.telefone)) {
      return json({ ok: false, erro: 'dados_insuficientes' });
    }

    var aba = pegarAba();

    aba.appendRow([
      new Date(),
      p.nome || '',
      p.email || '',
      p.telefone || '',
      p.modalidade || '',
      p.mensagem || '',
      ORIGEM_FORMULARIO,
      p.pagina || '',
      p.consentimento ? 'Sim' : 'Não',
      p.secao || '',
    ]);

    // Gravar o lead é o que não pode falhar. A notificação vem DEPOIS e com try/catch
    // próprio: se o WhatsApp ou o e-mail cair, a linha já está na planilha.
    notificar(p);

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, erro: String(err) });
  }
}

// --- Notificação da Ana -----------------------------------------------------
//
// Avisa a nutricionista a cada lead, para ela não depender de abrir a planilha.
//
// Configuração: Apps Script → Configurações do projeto → Propriedades do script.
// Nenhuma delas fica no código, para não vazar segredo no repositório.
//
//   WHATSAPP_DESTINO   ex.: +5562994959804  (formato internacional, com +)
//   CALLMEBOT_APIKEY   chave que o bot do CallMeBot devolve à Ana
//   EMAIL_DESTINO      e-mail do lead; aceita vários, separados por vírgula
//
// Propriedade ausente = aquele canal é pulado, sem erro. Dá para ligar só um.
//
// As propriedades NÃO são versionadas junto com a implantação: elas são lidas em
// tempo de execução. Acrescentar a CALLMEBOT_APIKEY depois liga o WhatsApp na hora,
// sem republicar o Web App e sem tocar no código.

function notificar(p) {
  var texto = montarTexto(p);

  try {
    notificarWhatsapp(texto);
  } catch (err) {
    console.error('Falha ao notificar por WhatsApp: ' + err);
  }

  try {
    notificarEmail(p, texto);
  } catch (err) {
    console.error('Falha ao notificar por e-mail: ' + err);
  }
}

function montarTexto(p) {
  var linhas = [
    'Novo lead pelo formulário do site',
    '',
    'Nome: ' + (p.nome || '-'),
    'WhatsApp: ' + (p.telefone || '-'),
    'E-mail: ' + (p.email || '-'),
    'Consulta: ' + (p.modalidade || '-'),
  ];

  if (p.mensagem) {
    linhas.push('Mensagem: ' + p.mensagem);
  }

  linhas.push('Veio de: ' + (p.secao || p.pagina || '-'));
  linhas.push('');
  linhas.push('Os dados já estão na planilha.');

  return linhas.join('\n');
}

/**
 * CallMeBot: serviço gratuito de auto-notificação por WhatsApp. NÃO é a API oficial
 * da Meta — foi escolhido de propósito, porque registrar o número da Ana na API
 * oficial a impediria de usar o WhatsApp normal com as pacientes.
 *
 * Como a Ana obtém a apikey (uma vez, do celular dela):
 * manda "I allow callmebot to send me messages" para +34 644 51 95 23 no WhatsApp,
 * e o bot responde com a chave.
 */
function notificarWhatsapp(texto) {
  var props = PropertiesService.getScriptProperties();
  var telefone = props.getProperty('WHATSAPP_DESTINO');
  var apikey = props.getProperty('CALLMEBOT_APIKEY');

  if (!telefone || !apikey) return; // canal não configurado

  var url = 'https://api.callmebot.com/whatsapp.php'
    + '?phone=' + encodeURIComponent(telefone)
    + '&apikey=' + encodeURIComponent(apikey)
    + '&text=' + encodeURIComponent(texto);

  var resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });

  if (resp.getResponseCode() !== 200) {
    console.error('CallMeBot devolveu ' + resp.getResponseCode() + ': ' + resp.getContentText());
  }
}

function notificarEmail(p, texto) {
  // Aceita vários destinatários separados por vírgula (formato que o MailApp entende).
  // Hoje aponta para e-mails provisórios; trocar pelo da Ana quando ela tiver um.
  var email = PropertiesService.getScriptProperties().getProperty('EMAIL_DESTINO');
  if (!email) return; // canal não configurado

  MailApp.sendEmail({
    to: email,
    subject: 'Novo lead do site: ' + (p.nome || 'sem nome'),
    body: texto,
    // replyTo: responder o e-mail já responde a pessoa que preencheu o formulário.
    replyTo: p.email || undefined,
  });
}

// Chamada pelo navegador ao abrir a URL: útil para conferir se o deploy está de pé.
function doGet() {
  return json({ ok: true, servico: 'anaclaranutri-forms' });
}

/**
 * Devolve a primeira aba da planilha (a que já tem o cabeçalho da Ana) e garante
 * que ela tenha todas as colunas de COLUNAS.
 *
 * Só ACRESCENTA cabeçalhos que faltam, à direita. Nunca renomeia nem reordena o
 * que já existe, então as linhas antigas continuam válidas.
 */
function pegarAba() {
  var aba = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

  // Planilha vazia: escreve o cabeçalho inteiro.
  if (aba.getLastRow() === 0) {
    aba.appendRow(COLUNAS);
    formatarCabecalho(aba, COLUNAS.length);
    return aba;
  }

  var atuais = aba.getRange(1, 1, 1, aba.getLastColumn()).getValues()[0];
  var preenchidas = 0;
  for (var i = 0; i < atuais.length; i++) {
    if (String(atuais[i]).trim() !== '') preenchidas = i + 1;
  }

  // Faltam colunas à direita (ex.: Origem/Página/LGPD na primeira execução).
  if (preenchidas < COLUNAS.length) {
    var faltantes = COLUNAS.slice(preenchidas);
    aba.getRange(1, preenchidas + 1, 1, faltantes.length).setValues([faltantes]);
    formatarCabecalho(aba, COLUNAS.length);
  }

  return aba;
}

function formatarCabecalho(aba, largura) {
  aba.getRange(1, 1, 1, largura).setFontWeight('bold');
  aba.setFrozenRows(1);
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
