/* ==========================================================================
   ARQUIVO JAVASCRIPT 2 — SCRIPT CLÁSSICO
   ==========================================================================
   FINALIDADE
   - Extraído do bloco <script> original, mantendo a ordem de execução.
   - Não foi feita refatoração, troca de nomes ou mudança de lógica.

   COMO LOCALIZAR ALTERAÇÕES
   - Eventos de botões: pesquise por "addEventListener" ou "onclick".
   - Atualização visual: pesquise por "render", "update", "refresh" ou "draw".
   - Armazenamento local: pesquise por "localStorage" ou "sessionStorage".
   - Importações/exportações: pesquise por "XLSX", "CSV", "JSON" ou "download".
   - Login/permissões: pesquise por "login", "access", "permission" ou "role".
   - Modais: pesquise por "modal", "open" e "close".

   FUNÇÕES IDENTIFICADAS NESTE BLOCO
   - renderCotacaoCcChips()
   - getCotacaoCcSelecionados()
   - _cotacaoGetSuppliers()
   - _cotacaoGetAtuacao()
   - _cotacaoGetScopeCategories()
   - _cotacaoSupplierHasScope()
   - getCotacaoFiltrados()
   - populaCotacaoFiltros()
   - renderCotacaoTabela()
   - atualizaCheckAll()
   - atualizaCotacaoContador()
   - initCotacaoPage()
   - cotacaoAplicarModelo()
   - hookCotacaoNavigation()
   - fillSel()

   ALERTA TÉCNICO
   - Este arquivo deve continuar carregado na mesma posição e com o mesmo tipo.
   - Alterar a ordem dos scripts pode causar referências indefinidas.
   ========================================================================== */

// ─── ABA COTAÇÕES ────────────────────────────────────────────────────────────

// Estado local da aba
let COTACAO_SELECIONADOS = new Set(); // IDs dos fornecedores marcados

// Atalho para pegar elementos pelo id
const $c = id => document.getElementById(id);

// ── E-mails internos fixos disponíveis para CC ────────────────────────────────
const COTACAO_CC_EMAILS = [
  { nome: 'Lerrine Veloso',           email: 'lerrine.veloso@abilitytecnologia.com.br' },
  { nome: 'Ademir Santos',            email: 'ademir.santos@abilitytecnologia.com.br' },
  { nome: 'Noemia Dias',              email: 'noemia.dias@abilitytecnologia.com.br' },
  { nome: 'Julia Figueredo',          email: 'julia.figueredo@abilitytecnologia.com.br' },
  { nome: 'Michele Souza',            email: 'michele.souza@abilitytecnologia.com.br' },
  { nome: 'Julio Serrano',            email: 'julio.serrano@abilitytecnologia.com.br' },
  { nome: 'Alan Brito',               email: 'alan.brito@abilitytecnologia.com.br' },
  { nome: 'Lauane Palmeira',          email: 'lauane.palmeira@abilitytecnologia.com.br' },
  { nome: 'Hellen Pereira (Compras)', email: 'hellen.pereira@abilitytecnologia.com.br' },
  { nome: 'Mirella Pecora',           email: 'mirella.pecora@abilitytecnologia.com.br' },
  { nome: 'Camila Moreira',           email: 'camila.moreira@abilitytecnologia.com.br' },
  { nome: 'Daniel Baldini',           email: 'daniel.baldini@abilitytecnologia.com.br' },
  { nome: 'Fernando Silva',           email: 'fernando.silva@abilitytecnologia.com.br' },
];

// Renderiza os chips de seleção de CC
function renderCotacaoCcChips() {
  const wrap = $c('cotacaoCcWrap');
  if (!wrap) return;
  wrap.innerHTML = COTACAO_CC_EMAILS.map(p => {
    const id = 'cc_' + p.email.replace(/[@.]/g, '_');
    return `<label style="
      display:inline-flex;align-items:center;gap:6px;padding:6px 12px;
      border-radius:999px;border:1px solid var(--border);background:rgba(255,255,255,0.04);
      font-size:12px;cursor:pointer;transition:.18s ease;user-select:none;
      " title="${p.email}" id="lbl_${id}"
      onmouseover="this.style.background='rgba(59,130,246,0.10)'"
      onmouseout="this.style.background=document.getElementById('${id}').checked?'rgba(59,130,246,0.12)':'rgba(255,255,255,0.04)'">
      <input type="checkbox" id="${id}" data-email="${p.email}" data-nome="${p.nome}"
        style="accent-color:var(--primary);width:13px;height:13px;"
        onchange="document.getElementById('lbl_${id}').style.background=this.checked?'rgba(59,130,246,0.12)':'rgba(255,255,255,0.04)';document.getElementById('lbl_${id}').style.borderColor=this.checked?'rgba(59,130,246,0.4)':'var(--border)'">
      <span>${p.nome}</span>
    </label>`;
  }).join('');
}

// Retorna os e-mails de CC selecionados
function getCotacaoCcSelecionados() {
  return [...document.querySelectorAll('#cotacaoCcWrap input:checked')].map(el => el.dataset.email);
}

// Aguarda as funções do módulo ficarem disponíveis via window.*
function _cotacaoGetSuppliers()      { return typeof window.getSuppliers === 'function' ? window.getSuppliers() : []; }
function _cotacaoGetAtuacao(item)    { return typeof window.getAtuacaoEstados === 'function' ? window.getAtuacaoEstados(item) : []; }
function _cotacaoGetScopeCategories(){ return typeof window.getScopeCategories === 'function' ? window.getScopeCategories() : []; }
function _cotacaoSupplierHasScope(item, escopo){ return typeof window.supplierHasScopeCategory === 'function' ? window.supplierHasScopeCategory(item, escopo) : true; }

// Quando o Firebase atualizar os dados, re-popula os filtros se a aba estiver ativa
window.__onSuppliersReady = function() {
  const cotacoesPage = document.getElementById('cotacoes');
  if (cotacoesPage && cotacoesPage.classList.contains('active')) {
    populaCotacaoFiltros();
    renderCotacaoTabela();
  }
};

// Retorna fornecedores filtrados conforme os selects da aba cotações
function getCotacaoFiltrados() {
  const allSuppliers = _cotacaoGetSuppliers();
  const uf       = $c('cotacaoFiltroUf')?.value || 'todos';
  const atuacao  = $c('cotacaoFiltroAtuacao')?.value || 'todos';
  const escopo   = $c('cotacaoFiltroEscopo')?.value || 'todos';
  const segmento = $c('cotacaoFiltroSegmento')?.value || 'todos';

  return allSuppliers.filter(item => {
    if (!item.email || !String(item.email).includes('@')) return false;
    const okUf = uf === 'todos' || item.uf === uf;
    const estadosAtuacao = _cotacaoGetAtuacao(item);
    const okAtuacao = atuacao === 'todos' || estadosAtuacao.includes(atuacao);
    const okEscopo = escopo === 'todos' || _cotacaoSupplierHasScope(item, escopo);
    const okSeg = segmento === 'todos' || (item.segmentos || []).includes(segmento);
    return okUf && okAtuacao && okEscopo && okSeg;
  });
}

// Popula os selects de filtro com os dados reais do banco
function populaCotacaoFiltros() {
  const allSuppliers = _cotacaoGetSuppliers();

  const ufs = [...new Set(allSuppliers.map(i => i.uf).filter(Boolean))].sort();
  const estadosList = [...new Set(allSuppliers.flatMap(i => _cotacaoGetAtuacao(i)))].sort();
  const escopos = _cotacaoGetScopeCategories().length
    ? _cotacaoGetScopeCategories()
    : [...new Set(allSuppliers.map(i => i.escopo).filter(Boolean))].sort();

  const fillSel = (id, vals, label) => {
    const sel = $c(id);
    if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = `<option value="todos">${label}</option>`;
    vals.forEach(v => {
      const o = document.createElement('option');
      o.value = v; o.textContent = v;
      sel.appendChild(o);
    });
    if ([...sel.options].some(o => o.value === cur)) sel.value = cur;
  };

  fillSel('cotacaoFiltroUf', ufs, 'Todas');
  fillSel('cotacaoFiltroAtuacao', estadosList, 'Todos');
  fillSel('cotacaoFiltroEscopo', escopos, 'Todas');
}

// Renderiza a tabela de fornecedores da aba cotações
function renderCotacaoTabela() {
  const tbody  = $c('cotacaoTabelaBody');
  const vazio  = $c('cotacaoVazio');
  const counter = $c('cotacaoTotalFiltrado');
  if (!tbody) return;

  const lista = getCotacaoFiltrados();
  counter && (counter.textContent = `${lista.length} itens`);

  if (!lista.length) {
    tbody.innerHTML = '';
    vazio && (vazio.style.display = '');
    atualizaCotacaoContador();
    return;
  }
  vazio && (vazio.style.display = 'none');

  const esc = v => String(v || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  tbody.innerHTML = lista.map(item => {
    const checked = COTACAO_SELECIONADOS.has(item.id) ? 'checked' : '';
    const estadosAtuacao = _cotacaoGetAtuacao(item).join(' / ') || (item.regiaoAtuacao || '-');
    const segs = (item.segmentos || []).join(', ') || '-';
    return `
      <tr>
        <td style="text-align:center;">
          <input type="checkbox" class="cotacao-check" data-id="${esc(item.id)}"
            ${checked} style="accent-color:var(--primary);width:16px;height:16px;cursor:pointer;">
        </td>
        <td class="supplier-name">${esc(item.razao || item.nome || '-')}</td>
        <td class="muted-cell">${esc(item.email)}</td>
        <td><span class="chip info" style="font-size:11px;">${esc(item.uf || '-')}</span></td>
        <td class="muted-cell" style="font-size:12px;">${esc(estadosAtuacao || '-')}</td>
        <td class="muted-cell" style="font-size:12px;">${esc(item.escopo || '-')}</td>
        <td style="font-size:11px;">${esc(segs)}</td>
      </tr>`;
  }).join('');

  // Eventos nos checkboxes individuais
  tbody.querySelectorAll('.cotacao-check').forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.checked) {
        COTACAO_SELECIONADOS.add(cb.dataset.id);
      } else {
        COTACAO_SELECIONADOS.delete(cb.dataset.id);
      }
      atualizaCotacaoContador();
      atualizaCheckAll();
    });
  });

  atualizaCheckAll();
  atualizaCotacaoContador();
}

function atualizaCheckAll() {
  const checkAll = $c('cotacaoCheckAll');
  if (!checkAll) return;
  const visiveis = [...document.querySelectorAll('.cotacao-check')];
  const totalVis = visiveis.length;
  const marcados = visiveis.filter(cb => cb.checked).length;
  checkAll.indeterminate = marcados > 0 && marcados < totalVis;
  checkAll.checked = totalVis > 0 && marcados === totalVis;
}

// Atualiza o contador de selecionados e o preview dos destinatários
function atualizaCotacaoContador() {
  const total = COTACAO_SELECIONADOS.size;
  const counter = $c('cotacaoContador');
  counter && (counter.textContent = `${total} selecionado${total !== 1 ? 's' : ''}`);

  const aviso = $c('cotacaoAvisoLimite');
  aviso && (aviso.style.display = total > 50 ? '' : 'none');

  // Preview dos e-mails
  const preview = $c('cotacaoDestinatariosPreview');
  if (!preview) return;

  const allSuppliers = _cotacaoGetSuppliers();
  const selecionados = allSuppliers.filter(i => COTACAO_SELECIONADOS.has(i.id) && i.email);

  if (!selecionados.length) {
    preview.textContent = 'Nenhum fornecedor selecionado ainda.';
    return;
  }

  const esc = v => String(v || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  preview.innerHTML = selecionados.map(i =>
    `<span style="display:inline-block;margin:3px 6px 3px 0;padding:4px 10px;border-radius:999px;
      background:rgba(34,244,141,0.10);border:1px solid rgba(34,244,141,0.25);font-size:12px;color:#bbf7d0;">
      ${esc(i.razao || i.nome || i.email)} &lt;${esc(i.email)}&gt;
    </span>`
  ).join('');
}

// Inicializa a aba cotações quando o usuário navega até ela
function initCotacaoPage() {
  populaCotacaoFiltros();
  renderCotacaoTabela();
}

// Filtros disparam re-render

var COTACAO_MODELOS = window.COTACAO_MODELOS || {
  servico: {
    assunto: 'Solicitação de Cotação — Serviço [descreva o objeto]',
    mensagem: `Prezados,

Solicitamos, por gentileza, o envio de proposta para prestação do serviço abaixo:

SERVIÇO: [descrever]
LOCAL: [informar endereço/UF]
PRAZO DE EXECUÇÃO: [informar]
ESCOPO TÉCNICO: [detalhar atividades, materiais inclusos, mobilização, documentação e premissas]

Favor informar:
- Valor total e impostos aplicáveis;
- Prazo de execução;
- Condições de pagamento;
- Validade da proposta;
- Necessidade de visita técnica, se houver.

Atenciosamente,
Equipe de Compras`
  },
  material: {
    assunto: 'Solicitação de Cotação — Material [descreva o item]',
    mensagem: `Prezados,

Solicitamos, por gentileza, o envio de cotação para fornecimento dos materiais abaixo:

MATERIAL/ITEM: [descrever]
QUANTIDADE: [informar]
UNIDADE: [un, pc, cx, m, m², m³ etc.]
LOCAL DE ENTREGA: [informar endereço/UF]
PRAZO DE ENTREGA DESEJADO: [informar]

Favor informar:
- Valor unitário e valor total;
- IPI, ICMS, DIFAL, frete e demais custos, quando houver;
- Prazo de entrega;
- Condições de pagamento;
- Validade da proposta;
- Dados técnicos/NCM, quando aplicável.

Atenciosamente,
Equipe de Compras`
  }
};
function cotacaoAplicarModelo(forcar=false) {
  const tipo = $c('cotacaoModelo')?.value || 'servico';
  const modelo = COTACAO_MODELOS[tipo];
  if(!modelo) return;
  const assunto = $c('cotacaoAssunto');
  const mensagem = $c('cotacaoMensagem');
  if(assunto && (forcar || !assunto.dataset.manualEdit)) assunto.value = modelo.assunto;
  if(mensagem && (forcar || !mensagem.dataset.manualEdit)) mensagem.value = modelo.mensagem;
}
$c('cotacaoModelo')?.addEventListener('change', () => cotacaoAplicarModelo(true));
$c('cotacaoAssunto')?.addEventListener('input', e => e.target.dataset.manualEdit = '1');
$c('cotacaoMensagem')?.addEventListener('input', e => e.target.dataset.manualEdit = '1');

['cotacaoFiltroUf','cotacaoFiltroAtuacao','cotacaoFiltroEscopo','cotacaoFiltroSegmento'].forEach(id => {
  const el = $c(id);
  el && el.addEventListener('change', () => {
    COTACAO_SELECIONADOS.clear();
    renderCotacaoTabela();
  });
});

// Check all visíveis
$c('cotacaoCheckAll')?.addEventListener('change', e => {
  const checked = e.target.checked;
  document.querySelectorAll('.cotacao-check').forEach(cb => {
    cb.checked = checked;
    if (checked) COTACAO_SELECIONADOS.add(cb.dataset.id);
    else COTACAO_SELECIONADOS.delete(cb.dataset.id);
  });
  atualizaCotacaoContador();
});

// Selecionar todos filtrados
$c('cotacaoSelecionarTodosBtn')?.addEventListener('click', () => {
  getCotacaoFiltrados().forEach(i => { if (i.email) COTACAO_SELECIONADOS.add(i.id); });
  renderCotacaoTabela();
});

// Limpar seleção
$c('cotacaoLimparSelecaoBtn')?.addEventListener('click', () => {
  COTACAO_SELECIONADOS.clear();
  renderCotacaoTabela();
});

// Abrir no Outlook
$c('cotacaoAbrirOutlookBtn')?.addEventListener('click', () => {
  const status = $c('cotacaoStatusMsg');

  if (!COTACAO_SELECIONADOS.size) {
    if (status) { status.style.color = 'var(--danger)'; status.textContent = '⚠️ Selecione ao menos um fornecedor antes de abrir o Outlook.'; }
    return;
  }

  const allSuppliers = _cotacaoGetSuppliers();
  const fornEmailsBcc = allSuppliers
    .filter(i => COTACAO_SELECIONADOS.has(i.id) && i.email)
    .map(i => i.email.trim());

  if (!fornEmailsBcc.length) {
    if (status) { status.style.color = 'var(--danger)'; status.textContent = '⚠️ Os fornecedores selecionados não têm e-mail cadastrado.'; }
    return;
  }

  const ccEmails  = getCotacaoCcSelecionados();
  const paraEmail = ($c('cotacaoParaCampo')?.value || '').trim();
  const assunto   = $c('cotacaoAssunto')?.value || 'Solicitação de Cotação';
  const mensagem  = $c('cotacaoMensagem')?.value || '';

  const bcc  = encodeURIComponent(fornEmailsBcc.join(';'));
  const cc   = ccEmails.length ? encodeURIComponent(ccEmails.join(';')) : '';
  const to   = paraEmail ? encodeURIComponent(paraEmail) : '';
  const subj = encodeURIComponent(assunto);
  const body = encodeURIComponent(mensagem);

  let mailto = `mailto:${to}?bcc=${bcc}`;
  if (cc) mailto += `&cc=${cc}`;
  mailto += `&subject=${subj}&body=${body}`;

  window.location.href = mailto;

  if (status) {
    const ccInfo = ccEmails.length ? ` + ${ccEmails.length} em CC` : '';
    status.style.color = 'var(--primary)';
    status.textContent = `✅ E-mail aberto: ${fornEmailsBcc.length} fornecedor(es) em CCO${ccInfo}.`;
    setTimeout(() => { if (status) status.textContent = ''; }, 6000);
  }
});

// Hook na navegação: inicializa a aba ao entrar nela
(function hookCotacaoNavigation() {
  const observer = new MutationObserver(() => {
    const cotacoesPage = $c('cotacoes');
    if (cotacoesPage && cotacoesPage.classList.contains('active')) {
      populaCotacaoFiltros();
      renderCotacaoTabela();
      renderCotacaoCcChips();
    }
  });
  const cotacoesPage = $c('cotacoes');
  if (cotacoesPage) observer.observe(cotacoesPage, { attributes: true, attributeFilter: ['class'] });
  // inicializar chips imediatamente para a primeira vez
  renderCotacaoCcChips();
})();
