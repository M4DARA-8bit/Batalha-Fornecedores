/* ==========================================================================
   ARQUIVO JAVASCRIPT 3 — SCRIPT CLÁSSICO
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
   - cpGetAliqInter()
   - cpShowTab()
   - cpInitUfSelect()
   - cpOnUfDestinoChange()
   - cpAtualizarBadges()
   - cpAddFornecedor()
   - cpRemoveFornecedor()
   - cpUpdateForn()
   - cpRenderFornecedores()
   - cpImportarDaBase()
   - cpRenderImportList()
   - cpConfirmarImport()
   - cpAddInsumo()
   - cpRemoveInsumo()
   - cpUpdateIns()
   - cpRenderInsumos()
   - cpImportarBulk()
   - cpRenderDifalTable()
   - cpRenderIpiTable()
   - cpSetIpi()
   - cpFmtBRL()
   - cpFmtNum()
   - cpCalcular()
   - cpBuildPrecoInput()
   - cpGerarResultado()
   - cpAbrirModalOrcamento()
   - cpParseBRL()
   - cpParsearOrcamento()
   - cpImportarOrcamento()
   - initComprasPage()
   - byId()
   - safeTxt()
   - norm()
   - digits()
   - cpInferColumns()
   - cpRowsToText()
   - cpFindFornecedorByCnpj()
   - normLocal()
   - onlyDigits()
   - rowsText()
   - inferCols()
   - fornecedorPorCnpj()
   - v9Norm()
   - v9Escape()
   - v9SiteLabel()
   - v9SiteBloco()
   - v9MaterialCnpjBloco()
   - v9EnsureCotacaoServiceBox()
   - v9PopularCnpjs()
   - v9UpdateCnpjPreview()
   - v9FilterSites()
   - v9UpdateSitePreview()
   - v9ToggleCotacaoBoxes()
   - v9AplicarModeloCotacao()
   - v9CompraInteligente()
   - v9GarantirResultado()
   - downloadCsvLocal()

   ALERTA TÉCNICO
   - Este arquivo deve continuar carregado na mesma posição e com o mesmo tipo.
   - Alterar a ordem dos scripts pode causar referências indefinidas.
   ========================================================================== */

// ─── ABA COMPRAS / DIFAL & IPI ───────────────────────────────────────────────

const CP_ESTADOS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];
const CP_ICMS_INTERNO = {AC:17,AL:17,AM:20,AP:18,BA:20.5,CE:20,DF:20,ES:17,GO:19,MA:22,MG:18,MS:17,MT:17,PA:19,PB:20,PE:20.5,PI:21,PR:19,RJ:20,RN:20,RO:17.5,RR:17,RS:17,SC:17,SE:19,SP:18,TO:18};
const CP_SUL_SUDESTE = ['SP','RJ','MG','RS','SC','PR'];
const CP_NORTE_NE_CO = ['AC','AL','AM','AP','BA','CE','GO','MA','MT','MS','PA','PB','PE','PI','RN','RO','RR','SE','TO','DF'];
const CP_UNIDADES = ['un','kg','lt','m','m²','m³','cx','pç','par','rl','bd','gl','sc','tb','fl'];
const $cp = id => document.getElementById(id);

let cpFornecedores = [], cpInsumos = [], cpIpiMatrix = {};
let cpFornId = 0, cpInsId = 0;
let cpPrecoData = {};
let _cpImportSelecionados = new Set();

function cpGetAliqInter(ufOrigem, ufDestino) {
  if (ufOrigem === ufDestino) return 0;
  if (CP_SUL_SUDESTE.includes(ufOrigem) && CP_NORTE_NE_CO.includes(ufDestino)) return 7;
  return 12;
}

// ── Sub-tabs ──────────────────────────────────────────────────────────────────
function cpShowTab(name) {
  document.querySelectorAll('.cp-page').forEach(p => p.style.display = 'none');
  document.querySelectorAll('.cp-tab').forEach(t => {
    t.style.borderBottomColor = 'transparent';
    t.style.color = 'var(--muted)';
    t.style.fontWeight = '400';
  });
  const page = $cp('cp-page-' + name);
  const tab = document.querySelector(`.cp-tab[data-tab="${name}"]`);
  if (page) page.style.display = 'block';
  if (tab) { tab.style.borderBottomColor = 'var(--primary)'; tab.style.color = 'var(--primary)'; tab.style.fontWeight = '600'; }
  if (name === 'config') cpRenderDifalTable();
  if (name === 'ipi') cpRenderIpiTable();
}

// ── Init UF select ────────────────────────────────────────────────────────────
function cpInitUfSelect() {
  const sel = $cp('cp-uf-destino');
  if (!sel || sel.options.length > 1) return;
  sel.innerHTML = '';
  CP_ESTADOS.forEach(uf => sel.innerHTML += `<option value="${uf}"${uf==='SP'?' selected':''}>${uf}</option>`);
  sel.value = 'SP';
  const aliq = $cp('cp-aliq-interno');
  if (aliq) aliq.value = CP_ICMS_INTERNO['SP'];
}

function cpOnUfDestinoChange() {
  const uf = $cp('cp-uf-destino')?.value;
  const aliq = $cp('cp-aliq-interno');
  if (uf && CP_ICMS_INTERNO[uf] && aliq) aliq.value = CP_ICMS_INTERNO[uf];
  cpRenderDifalTable();
  cpRenderFornecedores();
}

// ── Badges ────────────────────────────────────────────────────────────────────
function cpAtualizarBadges() {
  const bf = $cp('cp-badge-forn'), bi = $cp('cp-badge-ins');
  if (bf) bf.textContent = cpFornecedores.length;
  if (bi) bi.textContent = cpInsumos.length;
}

// ── FORNECEDORES ─────────────────────────────────────────────────────────────
function cpAddFornecedor(dados = {}) {
  cpFornId++;
  const id = cpFornId;
  cpFornecedores.push({ id, nome: dados.nome || '', uf: dados.uf || 'SP', cnpj: dados.cnpj || '', desconto: 0, descontoTipo: 'total', frete: 0, prazoEntrega: 0, outros: 0 });
  cpIpiMatrix[id] = {};
  cpInsumos.forEach(ins => { cpIpiMatrix[id][ins.id] = 0; });
  cpRenderFornecedores();
  cpRenderDifalTable();
  cpRenderIpiTable();
  cpAtualizarBadges();
}

function cpRemoveFornecedor(id) {
  cpFornecedores = cpFornecedores.filter(f => f.id !== id);
  delete cpIpiMatrix[id];
  cpRenderFornecedores();
  cpRenderDifalTable();
  cpRenderIpiTable();
  cpAtualizarBadges();
}

function cpUpdateForn(id, field, value) {
  const f = cpFornecedores.find(f => f.id === id);
  if (f) f[field] = value;
}

const cpEsc = v => String(v || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

function cpRenderFornecedores() {
  const g = $cp('cp-forn-grid');
  if (!g) return;
  if (!cpFornecedores.length) {
    g.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--muted);font-size:13px;">Nenhum fornecedor adicionado. Clique em "+ Adicionar" ou importe da base.</div>';
    return;
  }
  const ufDest = $cp('cp-uf-destino')?.value || 'SP';
  const aliqInt = parseFloat($cp('cp-aliq-interno')?.value) || 18;
  g.innerHTML = cpFornecedores.map((f, i) => {
    const aliqInter = cpGetAliqInter(f.uf, ufDest);
    const isSameUF = f.uf === ufDest;
    const difal = isSameUF ? 0 : Math.max(0, aliqInt - aliqInter);
    const difalLabel = isSameUF
      ? `<span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;padding:3px 8px;border-radius:6px;background:rgba(90,90,106,.2);color:var(--muted);border:1px solid var(--border);margin-top:6px;">✗ Sem DIFAL (mesma UF)</span>`
      : `<span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;padding:3px 8px;border-radius:6px;background:rgba(34,244,141,0.10);color:var(--primary);border:1px solid rgba(34,244,141,0.3);margin-top:6px;">✔ DIFAL ${difal.toFixed(2)}% aplicado</span>`;
    const ufOpts = CP_ESTADOS.map(uf => `<option value="${uf}"${uf===f.uf?' selected':''}>${uf}</option>`).join('');
    return `<div class="card" style="background:rgba(255,255,255,0.06);position:relative;">
      <button onclick="cpRemoveFornecedor(${f.id})" style="position:absolute;top:10px;right:10px;background:transparent;border:none;color:var(--muted);cursor:pointer;font-size:16px;line-height:1;" title="Remover">✕</button>
      <div style="font-size:10px;font-family:monospace;color:var(--primary);background:rgba(34,244,141,0.1);padding:2px 6px;border-radius:4px;margin-bottom:10px;display:inline-block;">FORN ${String(i+1).padStart(2,'0')}${f.cnpj ? ' · '+f.cnpj : ''}</div>
      <div class="field" style="margin-bottom:10px;">
        <label>Nome / Razão Social</label>
        <input type="text" value="${cpEsc(f.nome)}" placeholder="Ex: Distribuidora ABC Ltda"
          onchange="cpUpdateForn(${f.id},'nome',this.value);cpRenderDifalTable();cpRenderFornecedores();cpRenderIpiTable()">
      </div>
      <div class="field" style="margin-bottom:10px;">
        <label>UF do Fornecedor</label>
        <select onchange="cpUpdateForn(${f.id},'uf',this.value);cpRenderDifalTable();cpRenderFornecedores()">${ufOpts}</select>
        ${difalLabel}
      </div>
      <div class="form-grid" style="margin-bottom:10px;">
        <div class="field">
          <label>Desconto (%)</label>
          <input type="number" value="${f.desconto}" min="0" max="100" step="0.01" placeholder="0"
            onchange="cpUpdateForn(${f.id},'desconto',parseFloat(this.value)||0)">
          <label style="margin-top:6px;display:flex;align-items:center;gap:6px;font-size:11px;cursor:pointer;">
            <input type="checkbox" ${f.descontoTipo==='item'?'checked':''} style="accent-color:var(--primary);width:auto;"
              onchange="cpUpdateForn(${f.id},'descontoTipo',this.checked?'item':'total')">
            Por item
          </label>
        </div>
        <div class="field">
          <label>Prazo Entrega (dias)</label>
          <input type="number" value="${f.prazoEntrega}" min="0" step="1" placeholder="0"
            onchange="cpUpdateForn(${f.id},'prazoEntrega',parseInt(this.value)||0)">
        </div>
        <div class="field">
          <label>Frete % NF</label>
          <input type="number" value="${f.frete}" min="0" step="0.01" placeholder="0"
            onchange="cpUpdateForn(${f.id},'frete',parseFloat(this.value)||0)">
        </div>
        <div class="field">
          <label>Outros Custos (R$)</label>
          <input type="number" value="${f.outros}" min="0" step="0.01" placeholder="0"
            onchange="cpUpdateForn(${f.id},'outros',parseFloat(this.value)||0)">
        </div>
      </div>
    </div>`;
  }).join('');
}

// ── IMPORTAR DA BASE ──────────────────────────────────────────────────────────
function cpImportarDaBase() {
  const panel = $cp('cp-forn-import-panel');
  if (!panel) return;
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  if (panel.style.display === 'block') {
    // popular selects de filtro
    const allSup = typeof window.getSuppliers === 'function' ? window.getSuppliers() : [];
    const ufs = [...new Set(allSup.map(i => i.uf).filter(Boolean))].sort();
    const segs = [...new Set(allSup.flatMap(i => i.segmentos || []).filter(Boolean))].sort();
    const selUf = $cp('cp-import-uf');
    const selSeg = $cp('cp-import-seg');
    if (selUf) { selUf.innerHTML = '<option value="todos">Todas</option>' + ufs.map(u => `<option value="${u}">${u}</option>`).join(''); }
    if (selSeg) { selSeg.innerHTML = '<option value="todos">Todos</option>' + segs.map(s => `<option value="${s}">${cpEsc(s)}</option>`).join(''); }
    _cpImportSelecionados.clear();
    cpRenderImportList();
  }
}

function cpRenderImportList() {
  const list = $cp('cp-import-list');
  const countEl = $cp('cp-import-count');
  if (!list) return;
  const allSup = typeof window.getSuppliers === 'function' ? window.getSuppliers() : [];
  const search = ($cp('cp-import-search')?.value || '').toLowerCase();
  const uf = $cp('cp-import-uf')?.value || 'todos';
  const seg = $cp('cp-import-seg')?.value || 'todos';
  const filtered = allSup.filter(s => {
    const okUf = uf === 'todos' || s.uf === uf;
    const okSeg = seg === 'todos' || (s.segmentos || []).includes(seg);
    const hay = [s.razao, s.cnpj, s.email, s.uf].join(' ').toLowerCase();
    const okSearch = !search || hay.includes(search);
    return okUf && okSeg && okSearch;
  });
  if (!filtered.length) {
    list.innerHTML = '<div style="text-align:center;padding:1rem;color:var(--muted);font-size:12px;">Nenhum fornecedor encontrado.</div>';
    if (countEl) countEl.textContent = '';
    return;
  }
  list.innerHTML = filtered.map(s => {
    const checked = _cpImportSelecionados.has(s.id) ? 'checked' : '';
    return `<label style="display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid var(--border);border-radius:10px;background:rgba(255,255,255,0.04);cursor:pointer;font-size:13px;">
      <input type="checkbox" ${checked} style="accent-color:var(--primary);width:16px;height:16px;"
        onchange="if(this.checked) _cpImportSelecionados.add('${s.id}'); else _cpImportSelecionados.delete('${s.id}'); document.getElementById('cp-import-count').textContent = _cpImportSelecionados.size + ' selecionado(s)';">
      <span style="flex:1;"><strong>${cpEsc(s.razao || s.nome || '-')}</strong> · ${cpEsc(s.uf || '-')} · <span style="color:var(--muted);font-size:11px;">${cpEsc(s.escopo || '')} ${(s.segmentos||[]).join(', ')}</span></span>
    </label>`;
  }).join('');
  if (countEl) countEl.textContent = _cpImportSelecionados.size + ' selecionado(s)';
}

function cpConfirmarImport() {
  const allSup = typeof window.getSuppliers === 'function' ? window.getSuppliers() : [];
  const jaImportados = new Set(cpFornecedores.map(f => f.cnpj).filter(Boolean));
  let adicionados = 0;
  allSup.filter(s => _cpImportSelecionados.has(s.id)).forEach(s => {
    const cnpj = s.cnpj || '';
    if (cnpj && jaImportados.has(cnpj)) return;
    cpAddFornecedor({ nome: s.razao || s.nome || '', uf: s.uf || 'SP', cnpj });
    if (cnpj) jaImportados.add(cnpj);
    adicionados++;
  });
  _cpImportSelecionados.clear();
  const panel = $cp('cp-forn-import-panel');
  if (panel) panel.style.display = 'none';
  if (adicionados) cpShowTab('fornecedores');
}

// ── INSUMOS ───────────────────────────────────────────────────────────────────
function cpAddInsumo(nome = '', qty = 1, unit = 'un') {
  cpInsId++;
  const id = cpInsId;
  cpInsumos.push({ id, nome, qty, unit });
  cpFornecedores.forEach(f => {
    if (!cpIpiMatrix[f.id]) cpIpiMatrix[f.id] = {};
    if (cpIpiMatrix[f.id][id] === undefined) cpIpiMatrix[f.id][id] = 0;
  });
  cpRenderInsumos();
  cpRenderIpiTable();
  cpAtualizarBadges();
}

function cpRemoveInsumo(id) {
  cpInsumos = cpInsumos.filter(i => i.id !== id);
  cpFornecedores.forEach(f => { if (cpIpiMatrix[f.id]) delete cpIpiMatrix[f.id][id]; });
  cpRenderInsumos();
  cpRenderIpiTable();
  cpAtualizarBadges();
}

function cpUpdateIns(id, field, value) {
  const ins = cpInsumos.find(i => i.id === id);
  if (ins) ins[field] = value;
}

function cpRenderInsumos() {
  const tb = $cp('cp-insumos-body');
  if (!tb) return;
  if (!cpInsumos.length) {
    tb.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--muted);">Nenhum insumo cadastrado.</td></tr>';
    return;
  }
  tb.innerHTML = cpInsumos.map((ins, i) => {
    const unitOpts = CP_UNIDADES.map(u => `<option value="${u}"${u===ins.unit?' selected':''}>${u}</option>`).join('');
    return `<tr>
      <td style="color:var(--muted);font-family:monospace;font-size:12px;">${i+1}</td>
      <td><input type="text" value="${cpEsc(ins.nome)}" placeholder="Descrição do item" style="font-size:13px;"
        onchange="cpUpdateIns(${ins.id},'nome',this.value);cpRenderIpiTable()"></td>
      <td><input type="number" value="${ins.qty}" min="0.001" step="any" style="width:80px;"
        onchange="cpUpdateIns(${ins.id},'qty',parseFloat(this.value)||1)"></td>
      <td><select onchange="cpUpdateIns(${ins.id},'unit',this.value)" style="width:80px;">${unitOpts}</select></td>
      <td><button onclick="cpRemoveInsumo(${ins.id})" style="background:transparent;border:none;color:var(--muted);cursor:pointer;font-size:16px;transition:.15s;" onmouseover="this.style.color='#fb7185'" onmouseout="this.style.color='var(--muted)'">✕</button></td>
    </tr>`;
  }).join('');
}

function cpImportarBulk() {
  const lines = ($cp('cp-bulk-input')?.value || '').split('\n').filter(l => l.trim());
  lines.forEach(l => {
    const parts = l.split(';').map(p => p.trim());
    const nome = parts[0] || '';
    const qty = parseFloat(parts[1]) || 1;
    const unit = CP_UNIDADES.includes(parts[2]) ? parts[2] : 'un';
    if (nome) cpAddInsumo(nome, qty, unit);
  });
  if ($cp('cp-bulk-input')) $cp('cp-bulk-input').value = '';
  $cp('cp-bulk-panel').style.display = 'none';
}

// ── DIFAL TABLE ───────────────────────────────────────────────────────────────
function cpRenderDifalTable() {
  const area = $cp('cp-difal-table-area');
  if (!area) return;
  const ufDest = $cp('cp-uf-destino')?.value || 'SP';
  const aliqInt = parseFloat($cp('cp-aliq-interno')?.value) || 18;
  if (!cpFornecedores.length) {
    area.innerHTML = '<p style="color:var(--muted);font-size:13px;">Adicione fornecedores para ver a tabela DIFAL.</p>';
    return;
  }
  const rows = cpFornecedores.map(f => {
    const aliqInter = cpGetAliqInter(f.uf, ufDest);
    const isSame = f.uf === ufDest;
    const difal = isSame ? 0 : Math.max(0, aliqInt - aliqInter);
    return `<tr style="${!isSame&&difal>0?'background:rgba(34,244,141,0.07);':''}">
      <td style="padding:8px 10px;border:1px solid var(--border);font-weight:600;">${cpEsc(f.nome||'Fornecedor '+f.id)}</td>
      <td style="padding:8px 10px;border:1px solid var(--border);text-align:center;">${f.uf}</td>
      <td style="padding:8px 10px;border:1px solid var(--border);text-align:center;">${ufDest}</td>
      <td style="padding:8px 10px;border:1px solid var(--border);text-align:center;color:var(--muted);">${isSame?'—':aliqInter+'%'}</td>
      <td style="padding:8px 10px;border:1px solid var(--border);text-align:center;">${aliqInt.toFixed(2)}%</td>
      <td style="padding:8px 10px;border:1px solid var(--border);text-align:center;">${isSame?'<span style="color:var(--muted)">Mesma UF</span>':`<span style="background:var(--primary);color:#052013;border-radius:6px;padding:2px 8px;font-size:11px;font-weight:700;font-family:monospace;">${difal.toFixed(2)}%</span>`}</td>
    </tr>`;
  }).join('');
  area.innerHTML = `<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:12px;">
    <thead><tr>
      <th style="background:rgba(255,255,255,0.05);color:var(--muted);font-size:10px;font-weight:700;text-transform:uppercase;padding:8px 10px;text-align:left;border:1px solid var(--border);">Fornecedor</th>
      <th style="background:rgba(255,255,255,0.05);color:var(--muted);font-size:10px;font-weight:700;text-transform:uppercase;padding:8px 10px;text-align:center;border:1px solid var(--border);">UF Origem</th>
      <th style="background:rgba(255,255,255,0.05);color:var(--muted);font-size:10px;font-weight:700;text-transform:uppercase;padding:8px 10px;text-align:center;border:1px solid var(--border);">UF Destino</th>
      <th style="background:rgba(255,255,255,0.05);color:var(--muted);font-size:10px;font-weight:700;text-transform:uppercase;padding:8px 10px;text-align:center;border:1px solid var(--border);">Alíq. Interestadual</th>
      <th style="background:rgba(255,255,255,0.05);color:var(--muted);font-size:10px;font-weight:700;text-transform:uppercase;padding:8px 10px;text-align:center;border:1px solid var(--border);">Alíq. Interna Destino</th>
      <th style="background:rgba(255,255,255,0.05);color:var(--muted);font-size:10px;font-weight:700;text-transform:uppercase;padding:8px 10px;text-align:center;border:1px solid var(--border);">DIFAL Efetivo</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table></div>`;
}

// ── IPI TABLE ─────────────────────────────────────────────────────────────────
function cpRenderIpiTable() {
  const area = $cp('cp-ipi-table-area');
  if (!area) return;
  if (!cpFornecedores.length || !cpInsumos.length) {
    area.innerHTML = '<p style="padding:2rem;text-align:center;color:var(--muted);font-size:13px;">Adicione fornecedores e insumos para configurar o IPI.</p>';
    return;
  }
  const headCols = cpFornecedores.map(f => `<th style="background:rgba(255,255,255,0.05);color:var(--muted);font-size:10px;font-weight:700;text-transform:uppercase;padding:9px 12px;border:1px solid var(--border);text-align:center;white-space:nowrap;">${cpEsc(f.nome||'Forn '+f.id)}<br><span style="font-size:9px;color:var(--primary);font-weight:400">${f.uf}</span></th>`).join('');
  const bodyRows = cpInsumos.map(ins => {
    const cells = cpFornecedores.map(f => {
      const val = cpIpiMatrix[f.id]?.[ins.id] ?? 0;
      return `<td style="padding:6px 8px;border:1px solid var(--border);text-align:center;"><input type="number" min="0" step="0.01" placeholder="0" value="${val}" style="width:72px;text-align:center;padding:5px 6px;font-family:monospace;font-size:12px;background:rgba(255,255,255,0.05);border:1px solid var(--border);color:var(--text);border-radius:8px;"
        onchange="cpSetIpi(${f.id},${ins.id},parseFloat(this.value)||0)"></td>`;
    }).join('');
    return `<tr><td style="padding:8px 12px;border:1px solid var(--border);font-weight:500;color:var(--text);">${cpEsc(ins.nome||'(sem nome)')}</td>${cells}</tr>`;
  }).join('');
  area.innerHTML = `<div style="overflow-x:auto;"><table style="border-collapse:collapse;font-size:12px;">
    <thead><tr><th style="background:rgba(255,255,255,0.05);color:var(--muted);font-size:10px;font-weight:700;text-transform:uppercase;padding:9px 12px;border:1px solid var(--border);text-align:left;min-width:160px;">Insumo \\ Fornecedor</th>${headCols}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table></div>`;
}

function cpSetIpi(fornId, insId, val) {
  if (!cpIpiMatrix[fornId]) cpIpiMatrix[fornId] = {};
  cpIpiMatrix[fornId][insId] = val;
}

// ── CÁLCULO ───────────────────────────────────────────────────────────────────
function cpFmtBRL(v) { return 'R$ ' + (v||0).toLocaleString('pt-BR', {minimumFractionDigits:2,maximumFractionDigits:2}); }
function cpFmtNum(v) { return (v||0).toLocaleString('pt-BR', {maximumFractionDigits:3}); }

function cpCalcular() {
  if (!cpFornecedores.length) { alert('Cadastre ao menos um fornecedor.'); cpShowTab('fornecedores'); return; }
  if (!cpInsumos.length) { alert('Cadastre ao menos um insumo.'); cpShowTab('insumos'); return; }
  cpBuildPrecoInput();
}

function cpBuildPrecoInput() {
  const tabela = `<div style="overflow-x:auto;">
    <table style="width:100%;border-collapse:collapse;font-size:13px;" id="cp-preco-table">
      <thead><tr>
        <th style="text-align:left;padding:10px 12px;background:rgba(255,255,255,0.05);color:var(--muted);border-bottom:1px solid var(--border);font-size:11px;font-weight:600;text-transform:uppercase;">Insumo</th>
        <th style="text-align:center;padding:10px 12px;background:rgba(255,255,255,0.05);color:var(--muted);border-bottom:1px solid var(--border);font-size:11px;font-weight:600;text-transform:uppercase;">Qtd</th>
        ${cpFornecedores.map(f => `<th style="text-align:center;padding:10px 12px;background:rgba(255,255,255,0.05);color:var(--muted);border-bottom:1px solid var(--border);font-size:11px;font-weight:600;text-transform:uppercase;white-space:nowrap;">
          R$/un — ${cpEsc(f.nome||'Forn '+f.id)}<br><span style="font-weight:400;color:var(--muted);font-size:10px;">${f.uf}${f.desconto>0?' · Desc '+f.desconto+'%':''}${f.prazoEntrega>0?' · '+f.prazoEntrega+'d':''}</span>
        </th>`).join('')}
      </tr></thead>
      <tbody>
        ${cpInsumos.map(ins => `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.06);">${cpEsc(ins.nome)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.06);text-align:center;color:var(--muted);">${cpFmtNum(ins.qty)} ${ins.unit}</td>
          ${cpFornecedores.map(f => `<td style="padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.06);text-align:center;">
            <input type="number" min="0" step="0.01" placeholder="0,00" value="${cpPrecoData[f.id+'_'+ins.id]||''}"
              onchange="cpPrecoData[${f.id}+'_'+${ins.id}]=parseFloat(this.value)||0"
              style="width:110px;text-align:right;background:rgba(255,255,255,0.05);border:1px solid var(--border);color:var(--text);border-radius:10px;padding:6px 10px;font-size:13px;">
          </td>`).join('')}
        </tr>`).join('')}
      </tbody>
    </table>
  </div>
  <div style="margin-top:16px;display:flex;gap:8px;justify-content:flex-end;">
    <button class="ghost-btn" onclick="cpShowTab('insumos')">← Voltar</button>
    <button class="primary-btn" onclick="cpGerarResultado()">▶ Gerar Comparativo</button>
  </div>`;
  const rc = $cp('cp-resultado-content');
  if (rc) rc.innerHTML = `<div class="card">${tabela}</div>`;
  cpShowTab('resultado');
}

function cpGerarResultado() {
  const aliqInterno = parseFloat($cp('cp-aliq-interno')?.value) || 18;
  const fcp = parseFloat($cp('cp-aliq-fcp')?.value) || 0;
  const partilha = parseFloat($cp('cp-partilha-difal')?.value) || 100;
  const pis = parseFloat($cp('cp-aliq-pis')?.value) || 0;
  const cofins = parseFloat($cp('cp-aliq-cofins')?.value) || 0;
  const margem = parseFloat($cp('cp-margem')?.value) || 0;
  const ufDestino = $cp('cp-uf-destino')?.value || 'SP';

  let resultados = {}, totaisForn = {};
  cpFornecedores.forEach(f => {
    resultados[f.id] = {};
    totaisForn[f.id] = 0;
    const aliqInter = cpGetAliqInter(f.uf, ufDestino);
    const isDifal = f.uf !== ufDestino;
    cpInsumos.forEach(ins => {
      const precoUnit = cpPrecoData[f.id + '_' + ins.id] || 0;
      const ipiPct = cpIpiMatrix[f.id]?.[ins.id] ?? 0;
      const qty = ins.qty;
      const desconto = f.desconto || 0;
      let valorNF = precoUnit * qty;
      if (f.descontoTipo === 'item') valorNF = precoUnit * (1 - desconto/100) * qty;
      const valorIPI = valorNF * ipiPct / 100;
      const freteVal = valorNF * (f.frete||0) / 100 + (f.outros||0);
      const pisCofVal = (valorNF + valorIPI) * (pis + cofins) / 100;
      let difalVal = 0, fcpVal = 0;
      if (isDifal) {
        const base = (valorNF + valorIPI) / (1 - aliqInterno/100);
        const icmsDest = base * aliqInterno/100;
        const icmsOrig = base * aliqInter/100;
        difalVal = (icmsDest - icmsOrig) * (partilha/100);
        fcpVal = base * fcp/100;
      }
      const totalSemMargem = valorNF + valorIPI + freteVal + pisCofVal + difalVal + fcpVal;
      const descontoNF = f.descontoTipo === 'total' ? totalSemMargem * (desconto/100) : 0;
      const totalFinal = (totalSemMargem - descontoNF) * (1 + margem/100);
      resultados[f.id][ins.id] = { precoUnit, ipiPct, valorNF, valorIPI, freteVal, pisCofVal, difalVal, fcpVal, descontoNF, totalFinal, qty, isDifal, desconto };
      totaisForn[f.id] += totalFinal;
    });
  });

  const rankSorted = [...cpFornecedores].sort((a,b) => (totaisForn[a.id]||0)-(totaisForn[b.id]||0));
  const melhorTotal = totaisForn[rankSorted[0]?.id] || 0;
  const piorTotal = totaisForn[rankSorted[rankSorted.length-1]?.id] || 0;

  // cards de resumo com classes dedicadas
  let html = `<div class="cp-resultado-card">
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.7px;color:#8a9bb8;margin-bottom:12px;">📊 RESUMO DO COMPARATIVO · Destino: ${ufDestino}</div>
    <div class="cp-metric-row">
      <div class="cp-metric"><div class="cp-metric-label">Menor custo total</div><div class="cp-metric-val green">${cpFmtBRL(melhorTotal)}</div><div style="font-size:11px;color:#8a9bb8;margin-top:4px;">${cpEsc(rankSorted[0]?.nome||'—')}</div></div>
      <div class="cp-metric"><div class="cp-metric-label">Maior custo total</div><div class="cp-metric-val red">${cpFmtBRL(piorTotal)}</div><div style="font-size:11px;color:#8a9bb8;margin-top:4px;">${cpEsc(rankSorted[rankSorted.length-1]?.nome||'—')}</div></div>
      <div class="cp-metric"><div class="cp-metric-label">Economia potencial</div><div class="cp-metric-val" style="color:#fbbf24;">${cpFmtBRL(piorTotal - melhorTotal)}</div><div style="font-size:11px;color:#8a9bb8;margin-top:4px;">Melhor vs. pior opção</div></div>
      <div class="cp-metric"><div class="cp-metric-label">Escopo</div><div class="cp-metric-val blue">${cpFornecedores.length}</div><div style="font-size:11px;color:#8a9bb8;margin-top:4px;">Fornecedores · ${cpInsumos.length} insumos</div></div>
    </div>
  </div>`;

  // tabela comparativa com classes dedicadas
  html += `<div class="cp-resultado-card">
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.7px;color:#8a9bb8;margin-bottom:12px;">📋 COMPARATIVO POR INSUMO · ICMS int. ${aliqInterno}% · PIS ${pis}% · COFINS ${cofins}%${fcp>0?' · FCP '+fcp+'%':''}</div>
    <div style="overflow-x:auto;"><table class="cp-tbl">
      <thead><tr>
        <th style="text-align:left;min-width:220px;">Insumo</th>
        <th style="text-align:center;">Qtd</th>
        <th style="text-align:center;">Un</th>
        ${cpFornecedores.map(f => `<th style="text-align:center;">${cpEsc(f.nome||'Forn '+f.id)}<br><span style="font-weight:400;color:#5b7a9a;font-size:9px;">${f.uf}${f.desconto>0?' · desc '+f.desconto+'%':''}${f.prazoEntrega>0?' · '+f.prazoEntrega+'d':''}</span></th>`).join('')}
      </tr></thead>
      <tbody>`;

  cpInsumos.forEach(ins => {
    const vals = cpFornecedores.map(f => resultados[f.id][ins.id]?.totalFinal || 0);
    const minVal = Math.min(...vals.filter(v => v > 0));
    html += `<tr>
      <td class="item-name">${cpEsc(ins.nome||'—')}</td>
      <td style="text-align:center;">${cpFmtNum(ins.qty)}</td>
      <td style="text-align:center;">${ins.unit}</td>
      ${cpFornecedores.map(f => {
        const r = resultados[f.id][ins.id];
        const total = r?.totalFinal || 0;
        const isBest = total > 0 && total === minVal && vals.filter(v => v === minVal).length < vals.length;
        return `<td class="${isBest?'best':''}" style="text-align:right;" title="${total===0?'—':`NF: ${cpFmtBRL(r.valorNF)} | IPI: ${cpFmtBRL(r.valorIPI)} | DIFAL: ${cpFmtBRL(r.difalVal)} | Frete: ${cpFmtBRL(r.freteVal)}`}">
          ${total===0?'<span style="color:#3d4a5c">—</span>':cpFmtBRL(total)}
          ${isBest?'<div style="font-size:9px;color:#34d399;margin-top:1px;">✓ melhor</div>':''}
        </td>`;
      }).join('')}
    </tr>`;
    // linha de detalhamento compacto
    html += `<tr class="detail-row"><td colspan="${3+cpFornecedores.length}" style="padding:0;">
      <div style="display:grid;grid-template-columns:220px 48px 48px ${cpFornecedores.map(()=>'1fr').join(' ')};gap:0;">
        <div></div><div></div><div></div>
        ${cpFornecedores.map(f => {
          const r = resultados[f.id][ins.id];
          if (!r || r.totalFinal===0) return `<div style="padding:3px 12px 6px;font-size:10px;color:#3d4a5c;">—</div>`;
          return `<div style="padding:3px 12px 6px;font-size:10px;color:#5b7a9a;line-height:1.9;font-family:'Courier New',monospace;">
            NF: ${cpFmtBRL(r.valorNF)}${r.desconto>0?` <span style="color:#fbbf24;">(${r.desconto}% off)</span>`:''}<br>
            IPI(${r.ipiPct}%): +${cpFmtBRL(r.valorIPI)}<br>
            ${r.isDifal?`DIFAL: +${cpFmtBRL(r.difalVal)}<br>`:''}
            Frete: +${cpFmtBRL(r.freteVal)}
          </div>`;
        }).join('')}
      </div>
    </td></tr>`;
  });

  html += `<tr class="total-row">
    <td colspan="3" class="item-name">TOTAL GERAL</td>
    ${cpFornecedores.map(f => {
      const t = totaisForn[f.id]||0;
      const isBest = t===melhorTotal && t>0;
      return `<td style="text-align:right;${isBest?'color:#34d399!important;':''}">${cpFmtBRL(t)}${isBest?'<div style="font-size:9px;color:#34d399;">✓ melhor</div>':''}</td>`;
    }).join('')}
  </tr>`;
  html += '</tbody></table></div></div>';

  // compra inteligente com classes dedicadas
  let compraInteligente = {}, totalCI = 0;
  cpInsumos.forEach(ins => {
    let melhorF = null, menorV = Infinity;
    cpFornecedores.forEach(f => {
      const v = resultados[f.id][ins.id]?.totalFinal || 0;
      if (v > 0 && v < menorV) { menorV = v; melhorF = f; }
    });
    if (melhorF) {
      if (!compraInteligente[melhorF.id]) compraInteligente[melhorF.id] = { nome: melhorF.nome||'Forn '+melhorF.id, total: 0, itens: [] };
      compraInteligente[melhorF.id].total += menorV;
      compraInteligente[melhorF.id].itens.push({ nome: ins.nome, valor: menorV });
      totalCI += menorV;
    }
  });

  html += `<div class="cp-resultado-card">
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.7px;color:#8a9bb8;margin-bottom:12px;">🛒 COMPRA INTELIGENTE — Menor custo por item</div>
    <div style="display:grid;gap:10px;margin-bottom:14px;">
      ${Object.values(compraInteligente).map(f => `
        <div class="cp-ci-block">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <div style="font-weight:700;color:#e8edf5;">${cpEsc(f.nome)}</div>
            <div style="color:#34d399;font-family:'Courier New',monospace;font-size:15px;">${cpFmtBRL(f.total)}</div>
          </div>
          <div style="font-size:11px;color:#8a9bb8;line-height:1.9;">${f.itens.map(i => `<span style="color:#5b7a9a;">•</span> ${cpEsc(i.nome)} <span style="color:#34d399;">→ ${cpFmtBRL(i.valor)}</span>`).join('<br>')}</div>
        </div>
      `).join('')}
    </div>
    <div style="padding:14px;background:rgba(59,130,246,0.07);border:1px solid rgba(59,130,246,0.2);border-radius:10px;display:flex;justify-content:space-between;align-items:center;">
      <div><div style="font-size:11px;color:#8a9bb8;margin-bottom:2px;text-transform:uppercase;letter-spacing:.5px;">Total da compra otimizada</div><div style="font-size:11px;color:#5b7a9a;">vs. ${cpFmtBRL(melhorTotal)} (melhor fornecedor único)</div></div>
      <div style="font-size:28px;font-weight:700;color:#34d399;font-family:'Courier New',monospace;">${cpFmtBRL(totalCI)}</div>
    </div>
  </div>`;

  // ranking com classes dedicadas
  const posColors = [{ bg:'#facc15', text:'#0f172a' }, { bg:'#94a3b8', text:'#0f172a' }, { bg:'#b45309', text:'#fff' }];
  html += `<div class="cp-resultado-card">
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.7px;color:#8a9bb8;margin-bottom:12px;">🏆 RANKING DE FORNECEDORES</div>
    ${rankSorted.map((f, i) => {
      const t = totaisForn[f.id]||0;
      const diff = t - melhorTotal;
      const isBest = i===0;
      const isDifal = f.uf !== ufDestino;
      const aliqInter = cpGetAliqInter(f.uf, ufDestino);
      const difal = isDifal ? Math.max(0, aliqInterno - aliqInter) : 0;
      const pc = posColors[i] || { bg:'rgba(255,255,255,0.1)', text:'#e8edf5' };
      return `<div class="cp-rank-card ${isBest?'rank-1':''}">
        <div class="cp-rank-pos" style="background:${pc.bg};color:${pc.text};">${i+1}º</div>
        <div style="flex:1;">
          <div style="font-weight:700;color:#e8edf5;margin-bottom:3px;">${cpEsc(f.nome||'Fornecedor '+f.id)}</div>
          <div style="font-size:11px;color:#8a9bb8;">${isBest?'✓ Melhor opção total':'+'+cpFmtBRL(diff)+' vs. melhor'} · UF: ${f.uf}${f.prazoEntrega>0?' · '+f.prazoEntrega+'d':''}${isDifal?' · DIFAL '+difal.toFixed(1)+'%':' · Sem DIFAL'}</div>
        </div>
        <div style="font-weight:700;font-size:18px;${isBest?'color:#34d399;':''}">${cpFmtBRL(t)}</div>
      </div>`;
    }).join('')}
  </div>`;

  html += `<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px;">
    <button class="ghost-btn" onclick="cpBuildPrecoInput()">← Editar preços</button>
    <button class="ghost-btn" onclick="cpImprimirComparativoPdf()">🖨️ Imprimir / PDF</button>
  </div>`;

  const rc = $cp('cp-resultado-content');
  if (rc) rc.innerHTML = html;
  window._cpLastResultados = resultados;
  window._cpLastTotais = totaisForn;
}

// ── PARSER DE ORÇAMENTO PDF ───────────────────────────────────────────────────
// Modelo: 109.01.042 Fornecimento e instalação de cabo...  1.000,00  UN  NCM  R$ 18,00  R$ 18.000,00
let _cpOrcItens = [];

function cpAbrirModalOrcamento() {
  const m = document.getElementById('cpOrcamentoModal');
  if (m) {
    m.classList.add('show');
    document.getElementById('cpOrcamentoPasteArea').value = '';
    const xlsxInput = document.getElementById('cpOrcamentoXlsxInput'); if(xlsxInput) xlsxInput.value = '';
    document.getElementById('cpOrcamentoPreview').style.display = 'none';
    document.getElementById('cpOrcamentoEmpty').style.display = 'none';
    _cpOrcItens = [];
  }
}
document.getElementById('cpCloseOrcamentoModal')?.addEventListener('click', () => {
  document.getElementById('cpOrcamentoModal')?.classList.remove('show');
});
document.getElementById('cpOrcamentoModal')?.addEventListener('click', e => {
  if (e.target === document.getElementById('cpOrcamentoModal'))
    document.getElementById('cpOrcamentoModal').classList.remove('show');
});

function cpParseBRL(str) {
  // "R$ 18.000,00" → 18000.00  |  "1.000,00" → 1000
  const s = String(str || '').replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.').trim();
  return parseFloat(s) || 0;
}

function cpParsearOrcamento() {
  const raw = (document.getElementById('cpOrcamentoPasteArea')?.value || '').trim();
  if (!raw) return;

  _cpOrcItens = [];
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // Heurística: linha com número + texto + qtde + UN + (NCM opcional) + valores
  // Padrão típico dos orçamentos ABILITY:
  //   "109.01.042 Fornecimento e instalação...   1.000,00   UN   NCM   R$18,00   R$18.000,00"
  // Também aceita sem código no início e sem NCM.

  const RE_VALOR = /R?\$?\s*[\d]{1,3}(?:\.\d{3})*,\d{2}/g;
  const RE_QTD   = /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?)\s*(UN|KG|LT|M²?|M³?|PC|CX|GL|SC|TB|FL|PÇ|PAR|RL|BD|UN\.?|KG\.?)/i;
  const RE_COD   = /^(\d{2,3}\.\d{2,3}\.\d{3}|00009\s*-\s*[\d.]+|999-\d+|\d{2}-\s*[\d.]+)/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Ignorar cabeçalhos
    if (/^(DADOS|DESCRI|QTDE?|NCM|V\.?\s*UNIT|V\.?\s*TOT|ITEM)/i.test(line)) continue;

    // Extrair valores monetários da linha
    const valores = [...(line.match(RE_VALOR) || [])];
    if (valores.length < 1) continue;

    // Extrair quantidade e unidade
    const qtdMatch = RE_QTD.exec(line);
    if (!qtdMatch) continue;

    const qtdeRaw = qtdMatch[1].replace(/\./g, '').replace(',', '.');
    const qtde = parseFloat(qtdeRaw) || 1;
    const unidade = qtdMatch[2].toUpperCase().replace(/\.$/, '');

    // Extrair código (opcional)
    const codMatch = RE_COD.exec(line);
    const codigo = codMatch ? codMatch[0].trim() : '';

    // Extrair descrição: texto entre o código e a qtde/unidade
    let descricao = line;
    if (codigo) descricao = descricao.slice(codigo.length).trim();
    // Remove qtde + unidade + tudo que vier depois (NCM + valores)
    const qtdPos = descricao.search(RE_QTD);
    if (qtdPos > 0) descricao = descricao.slice(0, qtdPos).trim();
    // Limpa prefixos numéricos (item: "1.", "2.", etc.)
    descricao = descricao.replace(/^\d+\.\s*/, '').trim();
    if (!descricao) continue;

    // Valor unitário = penúltimo valor; total = último (se 2+ valores)
    const vUnit = valores.length >= 2 ? cpParseBRL(valores[valores.length - 2]) : cpParseBRL(valores[0]);
    const vTotal = cpParseBRL(valores[valores.length - 1]);

    _cpOrcItens.push({ codigo, descricao, qtde, unidade, vUnit, vTotal, sel: true });
  }

  const tbody = document.getElementById('cpOrcamentoPreviewBody');
  const preview = document.getElementById('cpOrcamentoPreview');
  const empty = document.getElementById('cpOrcamentoEmpty');

  if (!_cpOrcItens.length) {
    preview.style.display = 'none';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  preview.style.display = 'block';

  const unOpts = cpUnOpts => CP_UNIDADES.includes(cpUnOpts.toLowerCase())
    ? cpUnOpts
    : cpUnOpts;

  tbody.innerHTML = _cpOrcItens.map((it, idx) => {
    const unitOpts = CP_UNIDADES.map(u => `<option value="${u}" ${u.toLowerCase()===it.unidade.toLowerCase()?'selected':''}>${u}</option>`).join('');
    return `<tr>
      <td style="text-align:center;"><input type="checkbox" class="cp-orc-check" data-idx="${idx}" checked style="accent-color:var(--primary);width:14px;height:14px;"></td>
      <td style="font-size:11px;color:var(--muted);font-family:monospace;white-space:nowrap;">${cpEsc(it.codigo)}</td>
      <td style="font-size:12px;max-width:320px;"><input type="text" value="${cpEsc(it.descricao)}" style="width:100%;font-size:12px;background:rgba(255,255,255,0.05);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:5px 8px;"
        onchange="_cpOrcItens[${idx}].descricao=this.value"></td>
      <td><input type="number" value="${it.qtde}" min="0.001" step="any" style="width:72px;font-size:12px;background:rgba(255,255,255,0.05);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:5px 8px;"
        onchange="_cpOrcItens[${idx}].qtde=parseFloat(this.value)||1"></td>
      <td><select style="font-size:12px;background:rgba(255,255,255,0.05);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:5px 8px;"
        onchange="_cpOrcItens[${idx}].unidade=this.value">${unitOpts}</select></td>
      <td style="font-size:12px;color:var(--muted);font-family:monospace;">${it.vUnit > 0 ? cpFmtBRL(it.vUnit) : '—'}</td>
      <td style="font-size:12px;font-family:monospace;font-weight:600;">${it.vTotal > 0 ? cpFmtBRL(it.vTotal) : '—'}</td>
    </tr>`;
  }).join('');
}

function cpImportarOrcamento() {
  const marcados = [...document.querySelectorAll('.cp-orc-check:checked')].map(el => parseInt(el.dataset.idx));
  if (!marcados.length) { alert('Selecione ao menos um item.'); return; }
  marcados.forEach(idx => {
    const it = _cpOrcItens[idx];
    if (!it) return;
    const descr = [it.codigo, it.descricao].filter(Boolean).join(' · ').slice(0, 120);
    const unNorm = CP_UNIDADES.includes(it.unidade.toLowerCase()) ? it.unidade.toLowerCase() : 'un';
    cpAddInsumo(descr, it.qtde, unNorm);
    const novoInsumo = cpInsumos[cpInsumos.length - 1];
    if(it.fornecedorId && novoInsumo && it.vUnit) cpPrecoData[it.fornecedorId + '_' + novoInsumo.id] = it.vUnit;
  });
  const status = document.getElementById('cpOrcamentoStatus');
  if (status) {
    status.textContent = `✅ ${marcados.length} item(ns) importado(s) com sucesso!`;
    status.style.color = 'var(--primary)';
    setTimeout(() => { status.textContent = ''; }, 3000);
  }
  document.getElementById('cpOrcamentoModal')?.classList.remove('show');
  cpShowTab('insumos');
}

// ── INIT DA ABA ───────────────────────────────────────────────────────────────
(function initComprasPage() {
  const comprasPage = document.getElementById('compras');
  if (!comprasPage) return;
  // Inicializar UF select quando a aba ficar visível pela primeira vez
  const observer = new MutationObserver(() => {
    if (comprasPage.classList.contains('active')) {
      cpInitUfSelect();
    }
  });
  observer.observe(comprasPage, { attributes: true, attributeFilter: ['class'] });
})();


/* === AJUSTES FELIPE 2.0 — FUNÇÕES DE COTAÇÃO, COMPRAS E PERFORMANCE === */
(function(){
  function byId(id){ return document.getElementById(id); }
  function safeTxt(v){ return String(v||'').replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }
  function norm(v){ return String(v||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,' ').trim(); }
  function digits(v){ return String(v||'').replace(/\D/g,''); }
  window.COTACAO_MODELOS = {
    servico: {
      assunto: 'Solicitação de Cotação — Prestação de Serviço | [Objeto]',
      mensagem: `Prezados, boa tarde.

Solicitamos, por gentileza, o envio de proposta comercial para prestação do serviço abaixo.

DADOS PARA COTAÇÃO
• Objeto: [descrever o serviço]
• Local de execução: [endereço / cidade / UF]
• Escopo: [detalhar atividades, inclusões e exclusões]
• Prazo desejado para execução: [informar]
• Necessidade de visita técnica: [sim/não — informar contato]
• Documentação necessária: [ASO, NR, ART, seguro, integração etc., se aplicável]

A PROPOSTA DEVE CONTER
• Valor total, impostos inclusos e eventuais custos adicionais;
• Prazo de execução e disponibilidade para início;
• Condições de pagamento;
• Validade da proposta;
• Dados completos da empresa, CNPJ e responsável comercial;
• Premissas técnicas e comerciais consideradas.

Por favor, retornar até [data limite].

Atenciosamente,
[Seu nome]
Compras — ABILITY`
    },
    material: {
      assunto: 'Solicitação de Cotação — Materiais | [Objeto/Item]',
      mensagem: `Prezados, boa tarde.

Solicitamos, por gentileza, o envio de cotação para fornecimento dos materiais abaixo.

DADOS PARA COTAÇÃO
• Material/item: [descrever item]
• Quantidade: [informar]
• Unidade: [UN / PC / CX / M / M² / M³ etc.]
• Marca/modelo/referência: [informar, se houver]
• Local de entrega: [endereço / cidade / UF]
• Prazo desejado de entrega: [informar]

A PROPOSTA DEVE CONTER
• Valor unitário e valor total;
• NCM, IPI, ICMS, DIFAL, frete e demais custos quando aplicável;
• Prazo de entrega;
• Condições de pagamento;
• Validade da proposta;
• Dados completos da empresa, CNPJ e responsável comercial;
• Ficha técnica/catálogo, quando aplicável.

Por favor, retornar até [data limite].

Atenciosamente,
[Seu nome]
Compras — ABILITY`
    }
  };
  window.cotacaoAplicarModelo = function(forcar){
    const tipo = byId('cotacaoModelo')?.value || 'servico';
    const modelo = window.COTACAO_MODELOS[tipo];
    if(!modelo) return;
    const assunto = byId('cotacaoAssunto');
    const msg = byId('cotacaoMensagem');
    if(assunto && (forcar || !assunto.dataset.manualEdit)) assunto.value = modelo.assunto;
    if(msg && (forcar || !msg.dataset.manualEdit)) msg.value = modelo.mensagem;
  };
  byId('cotacaoModelo')?.addEventListener('change', function(){ window.cotacaoAplicarModelo(true); });
  setTimeout(function(){ if(byId('cotacaoModelo')) window.cotacaoAplicarModelo(false); }, 250);

  const filterIds = ['filterSearch','filterRegion','filterAtuacaoEstado','filterScope','filterStage','filterSituation','cotacaoFiltroUf','cotacaoFiltroAtuacao','cotacaoFiltroEscopo','cotacaoFiltroSegmento'];
  let filterTimer = null;
  filterIds.forEach(id => {
    const el = byId(id);
    if(!el) return;
    const ev = el.tagName === 'INPUT' ? 'input' : 'change';
    el.addEventListener(ev, function(){
      clearTimeout(filterTimer);
      filterTimer = setTimeout(function(){
        if(typeof renderDashboard === 'function') renderDashboard();
        if(typeof renderCotacaoTabela === 'function') renderCotacaoTabela();
      }, 120);
    });
  });

  window.cpPopularFornecedorOrcamentoSelect = function(){
    const sel = byId('cpOrcamentoFornecedorSelect');
    if(!sel || !Array.isArray(window.cpFornecedores)) return;
    const current = sel.value;
    sel.innerHTML = '<option value="">Detectar automaticamente pelo CNPJ</option>' + cpFornecedores.map(f => `<option value="${safeTxt(f.id)}">${safeTxt(f.nome || 'Fornecedor')} ${f.cnpj ? '— '+safeTxt(f.cnpj) : ''} ${f.uf ? '('+safeTxt(f.uf)+')' : ''}</option>`).join('');
    if(current) sel.value = current;
  };

  const originalAbrir = window.cpAbrirModalOrcamento;
  window.cpAbrirModalOrcamento = function(){
    if(typeof originalAbrir === 'function') originalAbrir();
    window.cpPopularFornecedorOrcamentoSelect();
    const diag = byId('cpOrcamentoDiagnostico');
    if(diag) diag.textContent = 'Selecione um XLSX convertido do orçamento. O sistema tentará detectar CNPJ, fornecedor, descrição, quantidade, unidade, valor unitário e valor total.';
  };

  function cpInferColumns(rows){
    const limit = rows.slice(0, Math.min(rows.length, 12));
    let bestHeader = 0, bestScore = -1;
    limit.forEach((r, idx) => {
      const line = r.map(norm).join(' ');
      const score = ['descricao','produto','servico','item','quant','qtde','unidade','unitario','valor','total','cnpj','ncm'].reduce((acc,k)=>acc+(line.includes(k)?1:0),0);
      if(score > bestScore){ bestScore = score; bestHeader = idx; }
    });
    const headers = (rows[bestHeader] || []).map(norm);
    const find = keys => headers.findIndex(h => keys.some(k => h.includes(k)));
    return {
      headerRow: bestHeader,
      desc: find(['descricao','produto','servico','material','item']),
      qtd: find(['quant','qtde','qtd']),
      un: find(['unidade',' un','und','um']),
      unit: find(['unitario','vl unit','valor unit','preco unit']),
      total: find(['total','vl total','valor total']),
      ncm: find(['ncm'])
    };
  }

  function cpRowsToText(rows){ return rows.map(r => r.join(' ')).join('\n'); }
  function cpFindFornecedorByCnpj(text){
    const found = (text.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/g) || []).map(digits);
    const fornecedores = Array.isArray(window.cpFornecedores) ? window.cpFornecedores : [];
    for(const c of found){
      const f = fornecedores.find(x => digits(x.cnpj) === c);
      if(f) return { fornecedor:f, cnpj:c, todos:found };
    }
    return { fornecedor:null, cnpj:found[0] || '', todos:found };
  }

  window.cpImportarXlsxOrcamento = function(){
    const input = byId('cpOrcamentoXlsxInput');
    const file = input?.files?.[0];
    if(!file){ alert('Selecione um arquivo XLSX/XLS.'); return; }
    if(typeof XLSX === 'undefined'){ alert('Biblioteca XLSX não carregada. Verifique sua conexão com a internet e tente novamente.'); return; }
    const reader = new FileReader();
    reader.onload = function(e){
      try{
        const wb = XLSX.read(new Uint8Array(e.target.result), {type:'array'});
        let rows = [];
        wb.SheetNames.forEach(name => {
          const sheetRows = XLSX.utils.sheet_to_json(wb.Sheets[name], {header:1, raw:false, defval:''});
          rows = rows.concat(sheetRows.filter(r => r.some(c => String(c).trim())));
        });
        if(!rows.length){ alert('Nenhuma linha útil encontrada no XLSX.'); return; }
        const text = cpRowsToText(rows);
        const match = cpFindFornecedorByCnpj(text);
        const manualFornecedorId = byId('cpOrcamentoFornecedorSelect')?.value || '';
        const fornecedor = manualFornecedorId && Array.isArray(cpFornecedores) ? cpFornecedores.find(f => f.id === manualFornecedorId) : match.fornecedor;
        const cols = cpInferColumns(rows);
        const dataRows = rows.slice(cols.headerRow + 1);
        window._cpOrcItens = [];
        dataRows.forEach(r => {
          const descricao = String(r[cols.desc] || '').trim();
          if(!descricao || /total geral|subtotal|desconto|observa/i.test(descricao)) return;
          const qtde = cpParseBRL(r[cols.qtd]) || 1;
          const unidade = String(r[cols.un] || 'UN').trim().toUpperCase() || 'UN';
          const vUnit = cpParseBRL(r[cols.unit]);
          const vTotal = cpParseBRL(r[cols.total]) || (qtde && vUnit ? qtde * vUnit : 0);
          if(!vUnit && !vTotal) return;
          window._cpOrcItens.push({ codigo:String(r[cols.ncm] || '').trim(), descricao, qtde, unidade, vUnit:vUnit || (qtde ? vTotal/qtde : 0), vTotal, fornecedorId:fornecedor?.id || '', sel:true });
        });
        const diag = byId('cpOrcamentoDiagnostico');
        if(diag){
          const confidence = [cols.desc, cols.qtd, cols.unit, cols.total].filter(v => v >= 0).length;
          diag.innerHTML = `<strong>Diagnóstico:</strong><br>CNPJ encontrado: ${match.cnpj ? safeTxt(match.cnpj) : 'não localizado'}<br>Fornecedor sugerido: ${fornecedor ? safeTxt(fornecedor.nome) : 'não vinculado'}<br>Colunas detectadas: ${confidence}/4 essenciais<br>Itens lidos: ${window._cpOrcItens.length}`;
        }
        if(!window._cpOrcItens.length){
          const paste = byId('cpOrcamentoPasteArea');
          if(paste) paste.value = text;
          alert('Não consegui montar itens automaticamente. O texto foi enviado para o campo alternativo; clique em Identificar Itens.');
          return;
        }
        cpRenderOrcamentoPreviewSeguro();
      }catch(err){
        console.error(err);
        alert('Erro ao ler XLSX. Tente converter novamente o PDF ou use o campo de texto alternativo.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  window.cpRenderOrcamentoPreviewSeguro = function(){
    const tbody = byId('cpOrcamentoPreviewBody'), preview = byId('cpOrcamentoPreview'), empty = byId('cpOrcamentoEmpty');
    if(!tbody || !preview) return;
    const itens = window._cpOrcItens || [];
    if(!itens.length){ preview.style.display='none'; if(empty) empty.style.display='block'; return; }
    if(empty) empty.style.display='none'; preview.style.display='block';
    const unidades = Array.isArray(window.CP_UNIDADES) ? CP_UNIDADES : ['un','pc','cx','m','m2','m3','kg','lt'];
    tbody.innerHTML = itens.map((it, idx) => {
      const unitOpts = unidades.map(u => `<option value="${safeTxt(u)}" ${String(u).toLowerCase()===String(it.unidade).toLowerCase()?'selected':''}>${safeTxt(u)}</option>`).join('');
      const forn = Array.isArray(cpFornecedores) ? cpFornecedores.find(f => f.id === it.fornecedorId) : null;
      return `<tr>
        <td style="text-align:center;"><input type="checkbox" class="cp-orc-check" data-idx="${idx}" checked style="accent-color:var(--primary);width:14px;height:14px;"></td>
        <td style="font-size:11px;color:var(--muted);font-family:monospace;white-space:nowrap;">${safeTxt(it.codigo || '')}</td>
        <td style="font-size:12px;max-width:340px;"><input type="text" value="${safeTxt(it.descricao)}" style="width:100%;font-size:12px;background:#fff;border:1px solid var(--border);color:var(--text);border-radius:8px;padding:5px 8px;" onchange="_cpOrcItens[${idx}].descricao=this.value"></td>
        <td><input type="number" value="${it.qtde}" min="0.001" step="any" style="width:82px;font-size:12px;background:#fff;border:1px solid var(--border);color:var(--text);border-radius:8px;padding:5px 8px;" onchange="_cpOrcItens[${idx}].qtde=parseFloat(this.value)||1"></td>
        <td><select style="font-size:12px;background:#fff;border:1px solid var(--border);color:var(--text);border-radius:8px;padding:5px 8px;" onchange="_cpOrcItens[${idx}].unidade=this.value">${unitOpts}</select></td>
        <td style="font-size:12px;color:var(--muted);font-family:monospace;">${typeof cpFmtBRL === 'function' ? cpFmtBRL(it.vUnit) : it.vUnit}</td>
        <td style="font-size:12px;font-family:monospace;font-weight:700;">${typeof cpFmtBRL === 'function' ? cpFmtBRL(it.vTotal) : it.vTotal}</td>
      </tr>`;
    }).join('');
  };

  const originalParse = window.cpParsearOrcamento;
  window.cpParsearOrcamento = function(){
    if(typeof originalParse === 'function') originalParse();
    const manualFornecedorId = byId('cpOrcamentoFornecedorSelect')?.value || '';
    if(manualFornecedorId && Array.isArray(window._cpOrcItens)) window._cpOrcItens.forEach(it => it.fornecedorId = manualFornecedorId);
    const diag = byId('cpOrcamentoDiagnostico');
    if(diag && Array.isArray(window._cpOrcItens)) diag.innerHTML = `<strong>Texto analisado:</strong><br>Itens identificados: ${window._cpOrcItens.length}<br>Fornecedor manual: ${manualFornecedorId ? 'selecionado' : 'não selecionado'}`;
  };

  window.cpAuditarComparativo = function(){
    const faltas = [];
    if(!Array.isArray(cpFornecedores) || !cpFornecedores.length) faltas.push('nenhum fornecedor cadastrado');
    if(!Array.isArray(cpInsumos) || !cpInsumos.length) faltas.push('nenhum insumo cadastrado');
    (cpFornecedores||[]).forEach(f => { if(!f.uf) faltas.push(`UF ausente em ${f.nome||f.id}`); if(!f.cnpj) faltas.push(`CNPJ ausente em ${f.nome||f.id}`); });
    (cpInsumos||[]).forEach(ins => {
      const semPreco = (cpFornecedores||[]).filter(f => !(window.cpPrecoData||{})[f.id+'_'+ins.id]);
      if(semPreco.length) faltas.push(`${ins.nome}: sem preço em ${semPreco.length} fornecedor(es)`);
    });
    alert(faltas.length ? ('Pontos para corrigir:\n- ' + faltas.slice(0,18).join('\n- ') + (faltas.length > 18 ? '\n- ...' : '')) : 'Base pronta para cálculo. Nenhuma pendência crítica encontrada.');
  };

  window.cpSugerirMelhorCompra = function(){
    if(typeof cpCalcular === 'function') cpCalcular();
    if(!Array.isArray(cpFornecedores) || !cpFornecedores.length || !Array.isArray(cpInsumos) || !cpInsumos.length) { alert('Cadastre fornecedores e insumos antes de gerar o resumo.'); return; }
    const totais = {};
    cpFornecedores.forEach(f => { totais[f.id] = 0; cpInsumos.forEach(ins => { const val = Number((window.cpPrecoData||{})[f.id+'_'+ins.id] || 0) * Number(ins.qty || 1); totais[f.id] += val; }); });
    const ord = cpFornecedores.slice().sort((a,b)=>(totais[a.id]||Infinity)-(totais[b.id]||Infinity));
    const best = ord[0], second = ord[1];
    const economia = second ? (totais[second.id] - totais[best.id]) : 0;
    alert(`Melhor fornecedor pelo preço-base informado: ${best.nome || best.id}
Total estimado: ${typeof cpFmtBRL === 'function' ? cpFmtBRL(totais[best.id]) : totais[best.id]}
Economia contra 2º colocado: ${typeof cpFmtBRL === 'function' ? cpFmtBRL(economia) : economia}

Atenção: confirme no Resultado final com DIFAL, IPI, frete, descontos e prazo antes de decidir.`);
  };

  window.cpExportarComparativoCsv = function(){
    if(!Array.isArray(cpFornecedores) || !Array.isArray(cpInsumos) || !cpFornecedores.length || !cpInsumos.length){ alert('Cadastre fornecedores e insumos antes de exportar.'); return; }
    const linhas = [['Insumo','Quantidade','Unidade',...cpFornecedores.map(f => `${f.nome || f.id} (${f.uf || '-'})`)]];
    cpInsumos.forEach(ins => linhas.push([ins.nome, ins.qty, ins.unit, ...cpFornecedores.map(f => (window.cpPrecoData||{})[f.id+'_'+ins.id] || '')]));
    const csv = linhas.map(r => r.map(v => `"${String(v??'').replace(/"/g,'""')}"`).join(';')).join('\n');
    const blob = new Blob(['﻿'+csv], {type:'text/csv;charset=utf-8;'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'comparativo_compras_difal.csv'; a.click(); URL.revokeObjectURL(a.href);
  };
})();


/* === CORREÇÕES FELIPE 3.0 — BOTÕES COMPRAS/DIFAL, SENHA E EXPORTAÇÃO === */
(function(){
  const byId = id => document.getElementById(id);
  const safe = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const csvCellLocal = v => `"${String(v ?? '').replace(/"/g,'""')}"`;
  const brlNumber = v => Number(v || 0).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2});
  const downloadCsvLocal = (filename, linhas) => {
    const csv = '\ufeff' + linhas.map(row => row.map(csvCellLocal).join(';')).join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  };

  // Expõe as funções chamadas por botões inline da aba Compras/DIFAL.
  Object.assign(window, {
    cpShowTab,
    cpInitUfSelect,
    cpOnUfDestinoChange,
    cpAddFornecedor,
    cpRemoveFornecedor,
    cpUpdateForn,
    cpImportarDaBase,
    cpRenderImportList,
    cpConfirmarImport,
    cpAddInsumo,
    cpRemoveInsumo,
    cpUpdateIns,
    cpImportarBulk,
    cpRenderDifalTable,
    cpRenderIpiTable,
    cpSetIpi,
    cpCalcular,
    cpBuildPrecoInput,
    cpGerarResultado,
    cpAbrirModalOrcamento,
    cpParsearOrcamento,
    cpImportarOrcamento
  });

  // Mantém os dados de Compras visíveis para funções auxiliares sem perder o escopo do módulo.
  Object.defineProperty(window, 'cpFornecedores', { configurable:true, get(){ return cpFornecedores; } });
  Object.defineProperty(window, 'cpInsumos', { configurable:true, get(){ return cpInsumos; } });
  Object.defineProperty(window, 'cpPrecoData', { configurable:true, get(){ return cpPrecoData; } });

  // Troca de senha pelo próprio usuário, com gravação direta no Firestore.
  byId('ownPasswordForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const currentUser = getCurrentUser();
    if(!currentUser?.user) return alert('Faça login antes de alterar a senha.');
    const senhaAtual = byId('ownCurrentPass')?.value || '';
    const novaSenha = byId('ownNewPass')?.value || '';
    const confirma = byId('ownConfirmPass')?.value || '';
    if(novaSenha.length < 6) return alert('A nova senha precisa ter pelo menos 6 caracteres.');
    if(novaSenha !== confirma) return alert('A confirmação da senha não confere.');
    try {
      const username = slugUsername(currentUser.user);
      const snap = await getDoc(doc(db, COLLECTION_USERS, username));
      if(!snap.exists()) return alert('Seu usuário não foi localizado no Firestore. Entre novamente e tente de novo.');
      const data = snap.data() || {};
      const senhaSalva = String(data.senha || data.pass || '');
      if(senhaSalva && senhaSalva !== senhaAtual) return alert('Senha atual incorreta.');
      const patch = sanitizeForFirebase({
        senha:novaSenha,
        atualizadoPor:username,
        atualizadoEmIso:new Date().toISOString(),
        atualizadoEmBr:new Date().toLocaleString('pt-BR'),
        senhaAlteradaPeloUsuario:true
      });
      await setDoc(doc(db, COLLECTION_USERS, username), patch, {merge:true});
      const uid = data.uid || currentUser.uid || `local-${username}`;
      if(uid) await setDoc(doc(db, COLLECTION_USERS_UID, uid), patch, {merge:true});
      byId('ownPasswordForm').reset();
      writeAuditLog(null, 'Senha alterada pelo próprio usuário', [{campo:'Usuário', antes:username, depois:username}]);
      alert('Senha alterada com sucesso no Firestore.');
    } catch(err) {
      console.error(err);
      alert(`Não foi possível alterar a senha: ${err.message || err}`);
    }
  });

  // Modelos editáveis de cotação. Os textos continuam 100% alteráveis manualmente antes do envio.
  window.COTACAO_MODELOS = {
    servico: {
      assunto: 'Solicitação de Cotação — Serviço | [Objeto] | [Cidade/UF]',
      mensagem: `Prezados, boa tarde.\n\nSolicitamos, por gentileza, proposta comercial para execução do serviço abaixo:\n\nESCOPO DO SERVIÇO\n• Serviço: [descrever serviço]\n• Local de execução: [endereço / cidade / UF]\n• Prazo necessário: [informar prazo]\n• Visita técnica: [sim/não]\n• Responsável para alinhamento técnico: [nome / telefone]\n\nA PROPOSTA DEVE CONTER\n• Valor total dos serviços, com impostos inclusos;\n• Mão de obra, materiais, deslocamento, alimentação, hospedagem e demais custos, quando aplicável;\n• Prazo de execução e disponibilidade para início;\n• Condição de pagamento;\n• Validade da proposta;\n• Dados da empresa, CNPJ e responsável comercial;\n• Premissas, exclusões e documentos técnicos necessários.\n\nPor favor, retornar até [data limite].\n\nAtenciosamente,\n[Seu nome]\nCompras — ABILITY`
    },
    material: {
      assunto: 'Solicitação de Cotação — Material | [Item] | [Cidade/UF]',
      mensagem: `Prezados, boa tarde.\n\nSolicitamos, por gentileza, cotação para fornecimento dos materiais abaixo:\n\nDADOS DO MATERIAL\n• Item/material: [descrever item]\n• Quantidade: [informar]\n• Unidade: [UN / PC / CX / M / M² / M³ etc.]\n• Marca/modelo/referência: [informar, se houver]\n• Local de entrega: [endereço / cidade / UF]\n• Prazo desejado de entrega: [informar]\n\nA PROPOSTA DEVE CONTER\n• Valor unitário e valor total;\n• NCM, IPI, ICMS, DIFAL, ST e frete, quando aplicável;\n• Prazo de entrega;\n• Condição de pagamento;\n• Validade da proposta;\n• Dados da empresa, CNPJ e responsável comercial;\n• Catálogo/ficha técnica, quando aplicável.\n\nPor favor, retornar até [data limite].\n\nAtenciosamente,\n[Seu nome]\nCompras — ABILITY`
    }
  };
  window.cotacaoAplicarModelo = function(forcar=true){
    const tipo = byId('cotacaoModelo')?.value || 'servico';
    const modelo = window.COTACAO_MODELOS[tipo];
    if(!modelo) return;
    const assunto = byId('cotacaoAssunto');
    const msg = byId('cotacaoMensagem');
    if(assunto && forcar) assunto.value = modelo.assunto;
    if(msg && forcar) msg.value = modelo.mensagem;
  };
  byId('cotacaoModelo')?.addEventListener('change', () => window.cotacaoAplicarModelo(true));

  // XLSX: importa orçamento convertido, detecta CNPJ e vincula preços ao fornecedor correto.
  window.cpPopularFornecedorOrcamentoSelect = function(){
    const sel = byId('cpOrcamentoFornecedorSelect');
    if(!sel) return;
    const atual = sel.value;
    sel.innerHTML = '<option value="">Detectar automaticamente pelo CNPJ</option>' + cpFornecedores.map(f => `<option value="${safe(f.id)}">${safe(f.nome || 'Fornecedor')} ${f.cnpj ? '— '+safe(f.cnpj) : ''} ${f.uf ? '('+safe(f.uf)+')' : ''}</option>`).join('');
    if(atual) sel.value = atual;
  };
  const abrirOriginal = window.cpAbrirModalOrcamento;
  window.cpAbrirModalOrcamento = function(){
    abrirOriginal?.();
    window.cpPopularFornecedorOrcamentoSelect();
    const diag = byId('cpOrcamentoDiagnostico');
    if(diag) diag.textContent = 'Importe o XLSX convertido do orçamento. O sistema tentará localizar CNPJ, fornecedor, descrição, quantidade, unidade, valor unitário e valor total.';
  };

  function normLocal(v){ return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim(); }
  function onlyDigits(v){ return String(v||'').replace(/\D/g,''); }
  function rowsText(rows){ return rows.map(r => r.join(' ')).join('\n'); }
  function inferCols(rows){
    const limit = rows.slice(0, Math.min(rows.length, 15));
    let headerRow = 0, scoreBest = -1;
    limit.forEach((r,idx)=>{
      const line = r.map(normLocal).join(' ');
      const score = ['descricao','produto','servico','material','item','quant','qtde','unidade','unitario','valor','total','ncm','cnpj'].reduce((a,k)=>a+(line.includes(k)?1:0),0);
      if(score > scoreBest){ scoreBest = score; headerRow = idx; }
    });
    const headers = (rows[headerRow] || []).map(normLocal);
    const find = keys => headers.findIndex(h => keys.some(k => h.includes(k)));
    return {
      headerRow,
      desc: find(['descricao','produto','servico','material','item']),
      qtd: find(['quant','qtde','qtd']),
      un: find(['unidade','und',' un','um']),
      unit: find(['unitario','vl unit','valor unit','preco unit']),
      total: find(['total','vl total','valor total']),
      ncm: find(['ncm','codigo','cod'])
    };
  }
  function fornecedorPorCnpj(texto){
    const cnpjs = (texto.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/g) || []).map(onlyDigits);
    for(const cnpj of cnpjs){
      const f = cpFornecedores.find(x => onlyDigits(x.cnpj) === cnpj);
      if(f) return {fornecedor:f, cnpj, todos:cnpjs};
    }
    return {fornecedor:null, cnpj:cnpjs[0] || '', todos:cnpjs};
  }
  window.cpImportarXlsxOrcamento = function(){
    const input = byId('cpOrcamentoXlsxInput');
    const file = input?.files?.[0];
    if(!file) return alert('Selecione um arquivo XLSX/XLS.');
    if(typeof XLSX === 'undefined') return alert('Biblioteca XLSX não carregada. Verifique a conexão e tente novamente.');
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const wb = XLSX.read(new Uint8Array(e.target.result), {type:'array'});
        let rows = [];
        wb.SheetNames.forEach(name => {
          rows = rows.concat(XLSX.utils.sheet_to_json(wb.Sheets[name], {header:1, raw:false, defval:''}).filter(r => r.some(c => String(c).trim())));
        });
        if(!rows.length) return alert('Nenhuma linha útil encontrada no XLSX.');
        const texto = rowsText(rows);
        const manualId = byId('cpOrcamentoFornecedorSelect')?.value || '';
        const match = fornecedorPorCnpj(texto);
        const fornecedor = manualId ? cpFornecedores.find(f => String(f.id) === String(manualId)) : match.fornecedor;
        const cols = inferCols(rows);
        _cpOrcItens = [];
        rows.slice(cols.headerRow + 1).forEach(r => {
          const descricao = String(cols.desc >= 0 ? r[cols.desc] : r.find(c => /[a-zA-ZÀ-ÿ]{4}/.test(String(c))) || '').trim();
          if(!descricao || /total geral|subtotal|desconto|observa/i.test(descricao)) return;
          const qtde = cpParseBRL(cols.qtd >= 0 ? r[cols.qtd] : '') || 1;
          const unidade = String(cols.un >= 0 ? r[cols.un] : 'UN').trim().toUpperCase() || 'UN';
          const vUnit = cpParseBRL(cols.unit >= 0 ? r[cols.unit] : '');
          const vTotal = cpParseBRL(cols.total >= 0 ? r[cols.total] : '') || (qtde && vUnit ? qtde * vUnit : 0);
          if(!vUnit && !vTotal) return;
          _cpOrcItens.push({
            codigo:String(cols.ncm >= 0 ? r[cols.ncm] : '').trim(),
            descricao,
            qtde,
            unidade,
            vUnit:vUnit || (qtde ? vTotal/qtde : 0),
            vTotal,
            fornecedorId:fornecedor?.id || '',
            sel:true
          });
        });
        const diag = byId('cpOrcamentoDiagnostico');
        if(diag){
          const colScore = [cols.desc, cols.qtd, cols.unit, cols.total].filter(v => v >= 0).length;
          diag.innerHTML = `<strong>Diagnóstico:</strong><br>CNPJ encontrado: ${match.cnpj ? safe(match.cnpj) : 'não localizado'}<br>Fornecedor vinculado: ${fornecedor ? safe(fornecedor.nome) : 'não vinculado'}<br>Colunas essenciais detectadas: ${colScore}/4<br>Itens lidos: ${_cpOrcItens.length}`;
        }
        if(!_cpOrcItens.length){
          const paste = byId('cpOrcamentoPasteArea');
          if(paste) paste.value = texto;
          return alert('Não consegui montar itens automaticamente. Colei o texto no campo alternativo; clique em Identificar Itens.');
        }
        cpParsearOrcamentoPreviewManual();
      } catch(err) {
        console.error(err);
        alert('Erro ao ler XLSX. Converta novamente o PDF ou use o campo de texto alternativo.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  window.cpParsearOrcamentoPreviewManual = function(){
    const tbody = byId('cpOrcamentoPreviewBody'), preview = byId('cpOrcamentoPreview'), empty = byId('cpOrcamentoEmpty');
    if(!tbody || !preview) return;
    if(!_cpOrcItens.length){ preview.style.display='none'; if(empty) empty.style.display='block'; return; }
    if(empty) empty.style.display='none'; preview.style.display='block';
    const unidades = Array.isArray(CP_UNIDADES) ? CP_UNIDADES : ['un','pc','cx','m','m2','m3','kg','lt'];
    tbody.innerHTML = _cpOrcItens.map((it, idx) => {
      const unitOpts = unidades.map(u => `<option value="${safe(u)}" ${String(u).toLowerCase()===String(it.unidade).toLowerCase()?'selected':''}>${safe(u)}</option>`).join('');
      return `<tr>
        <td style="text-align:center;"><input type="checkbox" class="cp-orc-check" data-idx="${idx}" checked style="accent-color:var(--primary);width:14px;height:14px;"></td>
        <td style="font-size:11px;color:var(--muted);font-family:monospace;white-space:nowrap;">${safe(it.codigo || '')}</td>
        <td><input type="text" value="${safe(it.descricao)}" style="width:100%;font-size:12px;background:#fff;border:1px solid var(--border);color:var(--text);border-radius:8px;padding:5px 8px;" onchange="_cpOrcItens[${idx}].descricao=this.value"></td>
        <td><input type="number" value="${it.qtde}" min="0.001" step="any" style="width:82px;font-size:12px;background:#fff;border:1px solid var(--border);color:var(--text);border-radius:8px;padding:5px 8px;" onchange="_cpOrcItens[${idx}].qtde=parseFloat(this.value)||1"></td>
        <td><select style="font-size:12px;background:#fff;border:1px solid var(--border);color:var(--text);border-radius:8px;padding:5px 8px;" onchange="_cpOrcItens[${idx}].unidade=this.value">${unitOpts}</select></td>
        <td style="font-size:12px;color:var(--muted);font-family:monospace;">${cpFmtBRL(it.vUnit)}</td>
        <td style="font-size:12px;font-family:monospace;font-weight:700;">${cpFmtBRL(it.vTotal)}</td>
      </tr>`;
    }).join('');
  };

  const importarOrcOriginal = window.cpImportarOrcamento;
  window.cpImportarOrcamento = function(){
    const marcados = [...document.querySelectorAll('.cp-orc-check:checked')].map(el => parseInt(el.dataset.idx));
    if(!marcados.length) return alert('Selecione ao menos um item.');
    marcados.forEach(idx => {
      const it = _cpOrcItens[idx];
      if(!it) return;
      const descr = [it.codigo, it.descricao].filter(Boolean).join(' · ').slice(0, 140);
      const unNorm = CP_UNIDADES.includes(String(it.unidade).toLowerCase()) ? String(it.unidade).toLowerCase() : 'un';
      cpAddInsumo(descr, it.qtde, unNorm);
      const novoInsumo = cpInsumos[cpInsumos.length - 1];
      if(it.fornecedorId && novoInsumo && it.vUnit) cpPrecoData[it.fornecedorId + '_' + novoInsumo.id] = Number(it.vUnit) || 0;
    });
    const status = byId('cpOrcamentoStatus');
    if(status){ status.textContent = `✅ ${marcados.length} item(ns) importado(s) e preço(s) vinculado(s).`; status.style.color = 'var(--primary)'; }
    byId('cpOrcamentoModal')?.classList.remove('show');
    cpShowTab('insumos');
  };

  window.cpAuditarComparativo = function(){
    const faltas = [];
    if(!cpFornecedores.length) faltas.push('nenhum fornecedor cadastrado');
    if(!cpInsumos.length) faltas.push('nenhum insumo cadastrado');
    cpFornecedores.forEach(f => { if(!f.nome) faltas.push(`nome ausente em fornecedor ${f.id}`); if(!f.uf) faltas.push(`UF ausente em ${f.nome || f.id}`); if(!f.cnpj) faltas.push(`CNPJ ausente em ${f.nome || f.id}`); });
    cpInsumos.forEach(ins => {
      const semPreco = cpFornecedores.filter(f => !Number(cpPrecoData[f.id + '_' + ins.id] || 0));
      if(semPreco.length) faltas.push(`${ins.nome}: sem preço em ${semPreco.length} fornecedor(es)`);
    });
    alert(faltas.length ? 'Pontos para corrigir:\n- ' + faltas.slice(0,22).join('\n- ') + (faltas.length > 22 ? '\n- ...' : '') : 'Base pronta para cálculo. Nenhuma pendência crítica encontrada.');
  };

  window.cpSugerirMelhorCompra = function(){
    if(!cpFornecedores.length || !cpInsumos.length) return alert('Cadastre fornecedores e insumos antes de gerar o resumo.');
    cpCalcular();
    const totais = window._cpLastTotais || {};
    const ord = cpFornecedores.slice().sort((a,b)=>(Number(totais[a.id] ?? Infinity))-(Number(totais[b.id] ?? Infinity)));
    const best = ord[0], second = ord[1];
    if(!best) return alert('Não foi possível montar o ranking. Verifique os preços informados.');
    const economia = second ? Number(totais[second.id] || 0) - Number(totais[best.id] || 0) : 0;
    alert(`Melhor compra pelo custo total calculado: ${best.nome || best.id}\nTotal: R$ ${brlNumber(totais[best.id])}\nEconomia contra 2º colocado: R$ ${brlNumber(economia)}\n\nValide prazo, frete, impostos e escopo antes da decisão final.`);
  };

  // Exportação específica do comparativo: não usa a base completa de fornecedores.
  window.cpExportarComparativoCsv = function(){
    if(!cpFornecedores.length || !cpInsumos.length) return alert('Cadastre fornecedores e insumos antes de exportar.');
    if(typeof cpGerarResultado === 'function') cpGerarResultado();
    const totais = window._cpLastTotais || {};
    const linhas = [];
    linhas.push(['COMPARATIVO COMPRAS / DIFAL']);
    linhas.push(['Gerado em', new Date().toLocaleString('pt-BR')]);
    linhas.push([]);
    linhas.push(['FORNECEDORES']);
    linhas.push(['Fornecedor','CNPJ','UF','Desconto %','Frete % NF','Outros custos R$','Prazo entrega dias','Total calculado R$']);
    cpFornecedores.forEach(f => linhas.push([f.nome, f.cnpj, f.uf, f.desconto, f.frete, f.outros, f.prazoEntrega, Number(totais[f.id] || 0).toFixed(2).replace('.',',')]));
    linhas.push([]);
    linhas.push(['ITENS E PREÇOS']);
    linhas.push(['Insumo','Quantidade','Unidade',...cpFornecedores.map(f => `${f.nome || f.id} - preço unitário`)]);
    cpInsumos.forEach(ins => linhas.push([ins.nome, ins.qty, ins.unit, ...cpFornecedores.map(f => Number(cpPrecoData[f.id + '_' + ins.id] || 0).toFixed(2).replace('.',','))]));
    downloadCsvLocal(`comparativo_compras_difal_${new Date().toISOString().slice(0,10)}.csv`, linhas);
  };


  // Ponte global definitiva dos botões do Comparativo.
  // Motivo: os botões HTML usam onclick="cp..."; estes nomes precisam existir em window.
  try {
    Object.defineProperty(window, 'cpFornecedores', { configurable:true, get:() => cpFornecedores, set:v => { cpFornecedores = Array.isArray(v) ? v : []; } });
    Object.defineProperty(window, 'cpInsumos', { configurable:true, get:() => cpInsumos, set:v => { cpInsumos = Array.isArray(v) ? v : []; } });
    Object.defineProperty(window, 'cpPrecoData', { configurable:true, get:() => cpPrecoData, set:v => { cpPrecoData = v && typeof v === 'object' ? v : {}; } });
    Object.defineProperty(window, 'cpIpiMatrix', { configurable:true, get:() => cpIpiMatrix, set:v => { cpIpiMatrix = v && typeof v === 'object' ? v : {}; } });
  } catch(e) { console.warn('Ponte CP já existia:', e); }

  Object.assign(window, {
    cpGetAliqInter, cpShowTab, cpInitUfSelect, cpOnUfDestinoChange, cpAtualizarBadges,
    cpAddFornecedor, cpRemoveFornecedor, cpUpdateForn, cpRenderFornecedores,
    cpImportarDaBase, cpRenderImportList, cpConfirmarImport,
    cpAddInsumo, cpRemoveInsumo, cpUpdateIns, cpRenderInsumos, cpImportarBulk,
    cpRenderDifalTable, cpRenderIpiTable, cpSetIpi, cpFmtBRL, cpFmtNum,
    cpCalcular, cpBuildPrecoInput, cpGerarResultado,
    cpAbrirModalOrcamento, cpParseBRL, cpParsearOrcamento, cpImportarOrcamento
  });

  // Modelos reais enviados por imagem — mantidos editáveis no textarea.
  window.COTACAO_MODELOS = {
    servico: {
      assunto: 'Solicitação de Cotação — Serviço | Favor não alterar o assunto do e-mail com o NR da RM',
      mensagem: `Prezado(a), bom dia!

Por favor, enviar orçamento para o serviço descrito abaixo:

Observações:
[Descreva aqui o serviço, escopo técnico, quantidades, locais e premissas.]

Por favor, mencionar na proposta as seguintes informações:

• Nome do solicitante (comprador)
• Nome do vendedor
• Validade da proposta
• Data de entrega ou prazo de execução do serviço
• Condição de pagamento

*Condição de pagamento mínima: 35DDL

**Favor não alterar o assunto do e-mail com o NR da RM**

Segue os dados do site (local do serviço):

Sigla Site: [informar]
Localidade: [informar]
Site Região: [informar]
Município: [informar]
Bairro: [informar]
Endereço: [informar]
CEP: [informar]
Latitude: [informar]
Longitude: [informar]
Altitude: [informar]

Atte.`
    },
    material: {
      assunto: 'Solicitação de Cotação — Material | [Objeto/Item]',
      mensagem: `Prezado(a), bom dia!

Solicito cotação para os insumos abaixo.

Imagens dos itens e suas descrições em anexo.

Descrição | Und | Qtde | V.Unit.Á | Valor Total
[Preencher itens, unidades, quantidades e valores]

CNPJ: [informar CNPJ do site/empresa]

Atte.`
    }
  };
  window.cotacaoAplicarModelo = function(forcar=true){
    const tipo = byId('cotacaoModelo')?.value || 'servico';
    const modelo = window.COTACAO_MODELOS[tipo];
    if(!modelo) return;
    const assunto = byId('cotacaoAssunto');
    const msg = byId('cotacaoMensagem');
    if(assunto && (forcar || !assunto.dataset.manualEdit)) assunto.value = modelo.assunto;
    if(msg && (forcar || !msg.dataset.manualEdit)) msg.value = modelo.mensagem;
  };
  byId('cotacaoModelo')?.addEventListener('change', () => window.cotacaoAplicarModelo(true));
  setTimeout(() => { if(byId('cotacaoModelo')) window.cotacaoAplicarModelo(false); }, 300);



  /* === PATCH V9 — CNPJ material, Sites VIVO serviço, CSV/PDF completo === */
  let ABILITY_CNPJ_BASES_V9 = [];;
  let VIVO_SITE_BASE_V9 = [];;
  let VIVO_BASE_CARREGADA_V9 = false;
  let VIVO_BASE_CARREGANDO_V9 = null;

  async function carregarBaseAbilityCotacao() {
    const status = document.getElementById('cotacaoBasesStatus');
    try {
      const response = await fetch('./bases-ability.json', { cache: 'no-cache' });
      if (!response.ok) throw new Error(`Bases Ability: HTTP ${response.status}`);
      ABILITY_CNPJ_BASES_V9 = await response.json();
      window.ABILITY_CNPJ_BASES = ABILITY_CNPJ_BASES_V9;
      if (status) status.textContent = 'Bases Ability carregadas. Digite ao menos 3 caracteres para pesquisar sites Vivo.';
    } catch (erro) {
      console.error('Falha ao carregar as bases Ability:', erro);
      if (status) status.textContent = 'Não foi possível carregar as bases Ability.';
      throw erro;
    }
  }

  async function carregarBaseVivoSobDemanda() {
    if (VIVO_BASE_CARREGADA_V9) return VIVO_SITE_BASE_V9;
    if (VIVO_BASE_CARREGANDO_V9) return VIVO_BASE_CARREGANDO_V9;
    const status = document.getElementById('cotacaoBasesStatus');
    if (status) status.textContent = 'Carregando base Vivo para a primeira pesquisa...';
    VIVO_BASE_CARREGANDO_V9 = fetch('./sites-vivo.json', { cache: 'no-cache' })
      .then(response => {
        if (!response.ok) throw new Error(`Sites Vivo: HTTP ${response.status}`);
        return response.json();
      })
      .then(data => {
        VIVO_SITE_BASE_V9 = Array.isArray(data) ? data : [];
        window.VIVO_SITE_BASE = VIVO_SITE_BASE_V9;
        VIVO_BASE_CARREGADA_V9 = true;
        if (status) status.textContent = `Base Vivo pronta. Pesquisa limitada a 10 resultados por vez.`;
        return VIVO_SITE_BASE_V9;
      })
      .catch(erro => {
        VIVO_BASE_CARREGANDO_V9 = null;
        console.error('Falha ao carregar a base Vivo:', erro);
        if (status) status.textContent = 'Não foi possível carregar a base Vivo.';
        throw erro;
      });
    return VIVO_BASE_CARREGANDO_V9;
  }

  window.ABILITY_CNPJ_BASES = ABILITY_CNPJ_BASES_V9;
  window.VIVO_SITE_BASE = VIVO_SITE_BASE_V9;

  function v9Norm(v){ return String(v||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,' ').trim(); }
  function v9Escape(v){ return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function v9SiteLabel(s){ return [s.sigla, s.municipio, s.bairro, s.endereco].filter(Boolean).join(' — ').slice(0,180); }
  function v9SiteBloco(site){
    if(!site) return `Sigla Site: [informar]
Localidade: [informar]
Site Região: [informar]
Município: [informar]
Bairro: [informar]
Endereço: [informar]
CEP: [informar]
Latitude: [informar]
Longitude: [informar]
Altitude: [informar]`;
    return `Sigla Site: ${site.sigla || '[informar]'}
Localidade: ${site.localidade || '[informar]'}
Site Região: ${site.regiao || '[informar]'}
Município: ${site.municipio || '[informar]'}
Bairro: ${site.bairro || '[informar]'}
Endereço: ${site.endereco || '[informar]'}
CEP: ${site.cep || '[informar]'}
Latitude: ${site.latitude || '[informar]'}
Longitude: ${site.longitude || '[informar]'}
Altitude: ${site.altitude || '[informar]'}`;
  }
  function v9MaterialCnpjBloco(base){ return base ? `CNPJ: ${base.cnpj} - ${base.base}` : 'CNPJ: [informar CNPJ do site/empresa]'; }

  function v9EnsureCotacaoServiceBox(){
    const cnpjBox = byId('cotacaoCnpjBaseBox');
    if(!cnpjBox || byId('cotacaoSiteServicoBox')) return;
    const box=document.createElement('div');
    box.id='cotacaoSiteServicoBox';
    box.className='form-grid cotacao-v9-box';
    box.innerHTML=`
      <div class="field row-span-2">
        <label>Buscar site VIVO para serviço</label>
        <input id="cotacaoSiteServicoSearch" placeholder="Digite sigla, município, bairro ou endereço">
      </div>
      <div class="field row-span-2">
        <label>Site VIVO selecionado</label>
        <select id="cotacaoSiteServicoSelect"><option value="">Pesquise para listar os sites</option></select>
      </div>
      <div class="field row-span-2">
        <label>Prévia dos dados do site</label>
        <textarea id="cotacaoSiteServicoPreview" readonly style="min-height:120px;line-height:1.45;">Selecione um site para preencher o corpo do e-mail de serviço.</textarea>
      </div>`;
    cnpjBox.parentNode.insertBefore(box, cnpjBox);
  }

  function v9PopularCnpjs(){
    const sel=byId('cotacaoCnpjBaseSelect');
    if(!sel) return;
    const cur=sel.value;
    sel.innerHTML='<option value="">Selecionar CNPJ ABILITY para inserir no corpo do e-mail</option>' + ABILITY_CNPJ_BASES_V9.map((b,i)=>`<option value="${i}">${v9Escape(b.cnpj)} - ${v9Escape(b.base)}</option>`).join('');
    if(cur && ABILITY_CNPJ_BASES_V9[Number(cur)]) sel.value=cur;
    v9UpdateCnpjPreview();
  }
  function v9UpdateCnpjPreview(){
    const sel=byId('cotacaoCnpjBaseSelect'), prev=byId('cotacaoCnpjBasePreview');
    const b = sel && sel.value!=='' ? ABILITY_CNPJ_BASES_V9[Number(sel.value)] : null;
    if(prev) prev.value = b ? `${b.cnpj} - ${b.base}` : '';
    if((byId('cotacaoModelo')?.value||'servico')==='material') v9AplicarModeloCotacao(true);
  }
  let v9SiteSearchTimer = null;
  async function v9FilterSites(){
    const input=byId('cotacaoSiteServicoSearch');
    const sel=byId('cotacaoSiteServicoSelect');
    const prev=byId('cotacaoSiteServicoPreview');
    if(!sel) return;
    const raw=String(input?.value||'').trim();
    const q=v9Norm(raw);
    if(raw.length < 3){
      sel.innerHTML='<option value="">Digite pelo menos 3 caracteres para pesquisar</option>';
      sel.disabled=true;
      if(prev) prev.value='A busca começa após 3 caracteres e mostra até 10 sites por vez.';
      return;
    }
    sel.disabled=true;
    sel.innerHTML='<option value="">Pesquisando sites...</option>';
    try {
      await carregarBaseVivoSobDemanda();
      const terms=q.split(' ').filter(Boolean);
      const list=[];
      for(let i=0;i<VIVO_SITE_BASE_V9.length && list.length<10;i++){
        const site=VIVO_SITE_BASE_V9[i];
        const txt=v9Norm(`${site.sigla} ${site.localidade} ${site.regiao} ${site.municipio} ${site.bairro} ${site.endereco} ${site.cep}`);
        if(terms.every(t => txt.includes(t))) list.push({site,index:i});
      }
      sel.disabled=false;
      if(!list.length){
        sel.innerHTML='<option value="">Nenhum site encontrado</option>';
        if(prev) prev.value='Nenhum site encontrado. Tente sigla, município, bairro, endereço ou CEP.';
        return;
      }
      sel.innerHTML='<option value="">Selecione um dos 10 resultados</option>' + list.map(item => `<option value="${item.index}">${v9Escape(v9SiteLabel(item.site))}</option>`).join('');
      if(list.length===1) sel.value=String(list[0].index);
      v9UpdateSitePreview();
    } catch(erro){
      sel.disabled=true;
      sel.innerHTML='<option value="">Erro ao carregar a base de sites</option>';
      if(prev) prev.value='Não foi possível consultar os sites Vivo.';
    }
  }
  function v9AgendarBuscaSites(){
    clearTimeout(v9SiteSearchTimer);
    v9SiteSearchTimer=setTimeout(v9FilterSites, 350);
  }
  function v9UpdateSitePreview(){
    const sel=byId('cotacaoSiteServicoSelect'), prev=byId('cotacaoSiteServicoPreview');
    const site = sel && sel.value!=='' ? VIVO_SITE_BASE_V9[Number(sel.value)] : null;
    if(prev) prev.value = site ? v9SiteBloco(site) : 'Selecione um site para preencher o corpo do e-mail de serviço.';
    if((byId('cotacaoModelo')?.value||'servico')==='servico') v9AplicarModeloCotacao(true);
  }
  function v9ToggleCotacaoBoxes(){
    const tipo=byId('cotacaoModelo')?.value || 'servico';
    const siteBox=byId('cotacaoSiteServicoBox'), cnpjBox=byId('cotacaoCnpjBaseBox');
    if(siteBox) siteBox.style.display = tipo==='servico' ? 'grid' : 'none';
    if(cnpjBox) cnpjBox.style.display = tipo==='material' ? 'grid' : 'none';
  }
  function v9AplicarModeloCotacao(forcar=true){
    const tipo=byId('cotacaoModelo')?.value || 'servico';
    const assunto=byId('cotacaoAssunto');
    const msg=byId('cotacaoMensagem');
    const siteSel=byId('cotacaoSiteServicoSelect');
    const site = siteSel && siteSel.value!=='' ? VIVO_SITE_BASE_V9[Number(siteSel.value)] : null;
    const cnpjSel=byId('cotacaoCnpjBaseSelect');
    const base = cnpjSel && cnpjSel.value!=='' ? ABILITY_CNPJ_BASES_V9[Number(cnpjSel.value)] : null;
    v9ToggleCotacaoBoxes();
    if(tipo==='servico'){
      if(assunto && forcar) assunto.value='Solicitação de Cotação — Serviço | Favor não alterar o assunto do e-mail com o Nº da RM';
      if(msg && forcar) msg.value=`Prezado(a), bom dia!

Por favor, enviar orçamento para o serviço descrito abaixo:

Observações:
[Descreva aqui o serviço, escopo técnico, quantidades, locais e premissas.]

Por favor, mencionar na proposta as seguintes informações:

• Nome do solicitante (comprador)
• Nome do vendedor
• Validade da proposta
• Data de entrega ou prazo de execução do serviço
• Condição de pagamento

*Condição de pagamento mínima: 35DDL

**Favor não alterar o assunto do e-mail com o Nº da RM**

Segue os dados do site (local do serviço):

${v9SiteBloco(site)}

Atte.`;
    } else {
      if(assunto && forcar) assunto.value='Solicitação de Cotação — Material | [Objeto/Item]';
      if(msg && forcar) msg.value=`Prezado(a), bom dia!

Solicito cotação para os insumos abaixo.

Imagens dos itens e suas descrições em anexo.

Descrição | Und | Qtde | V.Unit.Á | Valor Total
[Preencher itens, unidades, quantidades e valores]

${v9MaterialCnpjBloco(base)}

Atte.`;
    }
  }
  window.cotacaoAplicarModelo = v9AplicarModeloCotacao;
  window.popularBaseCnpj = v9PopularCnpjs;

  function v9CompraInteligente(resultados){
    const out={}, itens=[];
    cpInsumos.forEach(ins => {
      let best=null, val=Infinity;
      cpFornecedores.forEach(f => { const v=Number(resultados?.[f.id]?.[ins.id]?.totalFinal||0); if(v>0 && v<val){ val=v; best=f; } });
      if(best){
        if(!out[best.id]) out[best.id]={fornecedor:best,total:0,itens:[]};
        out[best.id].total+=val; out[best.id].itens.push({insumo:ins,valor:val}); itens.push({insumo:ins, fornecedor:best, valor:val});
      }
    });
    return {porFornecedor:Object.values(out), itens, total:itens.reduce((a,x)=>a+x.valor,0)};
  }
  function v9GarantirResultado(){
    if(!cpFornecedores.length || !cpInsumos.length) return false;
    if(typeof cpGerarResultado === 'function') cpGerarResultado();
    return !!(window._cpLastResultados && window._cpLastTotais);
  }
  window.cpExportarComparativoCsv = function(){
    if(!v9GarantirResultado()) return alert('Cadastre fornecedores e insumos antes de exportar.');
    const resultados=window._cpLastResultados||{}, totais=window._cpLastTotais||{};
    const ranking=cpFornecedores.slice().sort((a,b)=>(Number(totais[a.id]||0)-Number(totais[b.id]||0)));
    const ci=v9CompraInteligente(resultados);
    const linhas=[];
    linhas.push(['COMPARATIVO COMPRAS / DIFAL']);
    linhas.push(['Gerado em', new Date().toLocaleString('pt-BR')]);
    linhas.push(['UF destino', byId('cp-uf-destino')?.value || '']);
    linhas.push([]);
    linhas.push(['RESUMO']);
    linhas.push(['Melhor fornecedor', ranking[0]?.nome || '', 'Total R$', (Number(totais[ranking[0]?.id]||0)).toFixed(2).replace('.',',')]);
    linhas.push(['Pior fornecedor', ranking[ranking.length-1]?.nome || '', 'Total R$', (Number(totais[ranking[ranking.length-1]?.id]||0)).toFixed(2).replace('.',',')]);
    linhas.push(['Total compra inteligente', ci.total.toFixed(2).replace('.',',')]);
    linhas.push([]);
    linhas.push(['RANKING DE FORNECEDORES']);
    linhas.push(['Posição','Fornecedor','CNPJ','UF','Prazo entrega dias','Desconto %','Frete % NF','Outros custos R$','Total calculado R$','Diferença vs melhor R$']);
    const melhor=Number(totais[ranking[0]?.id]||0);
    ranking.forEach((f,i)=>linhas.push([i+1,f.nome,f.cnpj,f.uf,f.prazoEntrega,f.desconto,f.frete,f.outros,Number(totais[f.id]||0).toFixed(2).replace('.',','),(Number(totais[f.id]||0)-melhor).toFixed(2).replace('.',',')]));
    linhas.push([]);
    linhas.push(['DETALHAMENTO POR INSUMO E FORNECEDOR']);
    linhas.push(['Insumo','Qtd','Un','Fornecedor','CNPJ','UF','Preço unitário R$','Valor NF R$','IPI %','IPI R$','DIFAL R$','FCP R$','PIS/COFINS R$','Frete/outros R$','Desconto R$','Total final R$','Melhor do item']);
    cpInsumos.forEach(ins=>{
      let menor=Infinity;
      cpFornecedores.forEach(f=>{ const v=Number(resultados?.[f.id]?.[ins.id]?.totalFinal||0); if(v>0 && v<menor) menor=v; });
      cpFornecedores.forEach(f=>{
        const r=resultados?.[f.id]?.[ins.id]||{}; const total=Number(r.totalFinal||0);
        linhas.push([ins.nome,ins.qty,ins.unit,f.nome,f.cnpj,f.uf,Number(r.precoUnit||0).toFixed(2).replace('.',','),Number(r.valorNF||0).toFixed(2).replace('.',','),Number(r.ipiPct||0).toFixed(2).replace('.',','),Number(r.valorIPI||0).toFixed(2).replace('.',','),Number(r.difalVal||0).toFixed(2).replace('.',','),Number(r.fcpVal||0).toFixed(2).replace('.',','),Number(r.pisCofVal||0).toFixed(2).replace('.',','),Number(r.freteVal||0).toFixed(2).replace('.',','),Number(r.descontoNF||0).toFixed(2).replace('.',','),total.toFixed(2).replace('.',','), total>0 && total===menor ? 'SIM':'']);
      });
    });
    linhas.push([]);
    linhas.push(['COMPRA INTELIGENTE - MENOR CUSTO POR ITEM']);
    linhas.push(['Fornecedor','Insumo','Qtd','Un','Total do item R$']);
    ci.porFornecedor.forEach(grp=>grp.itens.forEach(x=>linhas.push([grp.fornecedor.nome,x.insumo.nome,x.insumo.qty,x.insumo.unit,x.valor.toFixed(2).replace('.',',')])));
    linhas.push(['TOTAL COMPRA INTELIGENTE','','','',ci.total.toFixed(2).replace('.',',')]);
    downloadCsvLocal(`comparativo_completo_${new Date().toISOString().slice(0,10)}.csv`, linhas);
  };
  window.cpImprimirComparativoPdf = function(){
    if(!v9GarantirResultado()) return alert('Gere o comparativo antes de imprimir.');
    const conteudo=byId('cp-resultado-content')?.innerHTML || '';
    const w=window.open('', '_blank', 'width=1200,height=800');
    if(!w) return alert('O navegador bloqueou a janela de impressão. Libere pop-ups para este site.');
    w.document.open();
    w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Comparativo Compras DIFAL</title><style>
      *{box-sizing:border-box} body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;background:#fff;margin:24px;font-size:12px} h1{font-size:20px;margin:0 0 6px} .meta{color:#334155;margin-bottom:18px} .cp-resultado-card{break-inside:avoid;border:1px solid #b6c6d8;border-radius:10px;padding:14px;margin:0 0 14px;background:#fff;color:#0f172a} .cp-metric-row{display:grid;grid-template-columns:repeat(4,1fr);gap:10px} .cp-metric{border:1px solid #cbd5e1;border-radius:8px;padding:10px;background:#f8fafc} .cp-metric-label{font-size:10px;color:#334155;text-transform:uppercase} .cp-metric-val{font-size:18px;font-weight:800;color:#0f172a} table{width:100%;border-collapse:collapse;font-size:10px} th{background:#dbeafe;color:#0f172a;border:1px solid #94a3b8;padding:6px} td{border:1px solid #cbd5e1;padding:6px;color:#0f172a} .best{background:#dcfce7!important;color:#047857!important;font-weight:800} .total-row td{background:#eaf2ff!important;font-weight:800} .cp-ci-block{background:#ecfdf5;border:1px solid #86efac;border-radius:8px;padding:8px;margin:6px 0} .cp-rank-card{display:flex;gap:10px;align-items:center;border:1px solid #cbd5e1;border-left:5px solid #0ea5e9;border-radius:8px;padding:8px;margin:6px 0} .rank-1{background:#dcfce7;border-left-color:#16a34a} button{display:none!important} @page{size:A4 landscape;margin:10mm}
    </style></head><body><h1>Comparativo de Preços · Compras / DIFAL</h1><div class="meta">Gerado em ${new Date().toLocaleString('pt-BR')}</div>${conteudo}</body></html>`);
    w.document.close();
    setTimeout(()=>{ try{ w.focus(); w.print(); }catch(e){ alert('Não foi possível abrir a impressão automática. Use Ctrl+P na janela gerada.'); } }, 500);
  };

  document.addEventListener('DOMContentLoaded', async () => {
    cpInitUfSelect?.();
    cpAtualizarBadges?.();
    try {
      await carregarBaseAbilityCotacao();
      v9PopularCnpjs();
      v9FilterSites();
      v9ToggleCotacaoBoxes();
      byId('cotacaoModelo')?.addEventListener('change', () => { v9ToggleCotacaoBoxes(); v9AplicarModeloCotacao(true); });
      byId('cotacaoCnpjBaseSelect')?.addEventListener('change', v9UpdateCnpjPreview);
      byId('cotacaoSiteServicoSearch')?.addEventListener('input', v9AgendarBuscaSites);
      byId('cotacaoSiteServicoSelect')?.addEventListener('change', v9UpdateSitePreview);
      setTimeout(() => { v9PopularCnpjs(); v9ToggleCotacaoBoxes(); v9AplicarModeloCotacao(true); }, 250);
    } catch(e) { console.warn('Falha ao inicializar controles de cotação V10', e); }
  });
})();
