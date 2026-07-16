/* ==========================================================================
   ARQUIVO JAVASCRIPT 4 — SCRIPT CLÁSSICO
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
   - acharCampo()
   - limparLinhaItem()
   - linhasParaItens()
   - lerArquivoItens()
   - tabelaTextoItens()
   - siteServicoTexto()
   - cnpjMaterialTexto()
   - renderCotacaoComItens()
   - atualizarPreviewItens()
   - onArquivoItensChange()
   - initCotacaoUploadItens()
   - $()
   - moneyBR()
   - norm()
   - fmt()

   ALERTA TÉCNICO
   - Este arquivo deve continuar carregado na mesma posição e com o mesmo tipo.
   - Alterar a ordem dos scripts pode causar referências indefinidas.
   ========================================================================== */

(function(){
  const $ = (id) => document.getElementById(id);
  const moneyBR = (value) => {
    const n = Number(String(value ?? '').replace(/\./g,'').replace(',','.').replace(/[^\d.-]/g,''));
    if(!Number.isFinite(n) || n === 0 && String(value ?? '').trim() === '') return '';
    return n.toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
  };
  const norm = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const cotacaoEstado = { itens: [] };

  function acharCampo(row, aliases){
    const keys = Object.keys(row || {});
    for(const a of aliases){
      const alvo = norm(a);
      const k = keys.find(x => norm(x) === alvo || norm(x).includes(alvo));
      if(k) return row[k];
    }
    return '';
  }

  function limparLinhaItem(item){
    const descricao = String(item.descricao ?? '').trim();
    if(!descricao) return null;
    return {
      descricao,
      quantidade: String(item.quantidade ?? '').trim(),
      unidade: String(item.unidade ?? '').trim(),
      valorUnitario: item.valorUnitario ?? '',
      valorTotal: item.valorTotal ?? ''
    };
  }

  function linhasParaItens(rows){
    return (rows || []).map(row => limparLinhaItem({
      descricao: acharCampo(row, ['DESCRIÇÃO','DESCRICAO','DESCRIÇÃO DO ITEM','ITEM','INSUMO','PRODUTO','SERVIÇO','SERVICO']),
      quantidade: acharCampo(row, ['QUANTIDADE','QTDE','QTD']),
      unidade: acharCampo(row, ['UNIDADE','UND','UN']),
      valorUnitario: acharCampo(row, ['VALOR UNI','VALOR UNITÁRIO','VALOR UNITARIO','V.UNIT.','V UNIT','PREÇO UNITÁRIO','PRECO UNITARIO']),
      valorTotal: acharCampo(row, ['VALOR TOTAL','TOTAL','V.TOTAL'])
    })).filter(Boolean);
  }

  async function lerArquivoItens(file){
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if(ext === 'csv'){
      const text = await file.text();
      const sep = (text.match(/;/g)||[]).length >= (text.match(/,/g)||[]).length ? ';' : ',';
      const linhas = text.split(/\r?\n/).filter(l => l.trim());
      const headers = (linhas.shift() || '').split(sep).map(h => h.trim());
      const rows = linhas.map(l => {
        const cols = l.split(sep).map(c => c.trim());
        return headers.reduce((acc,h,i)=>(acc[h]=cols[i] ?? '', acc), {});
      });
      return linhasParaItens(rows);
    }
    if(!window.XLSX) throw new Error('Biblioteca XLSX não carregada.');
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type:'array', cellDates:false });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval:'' });
    return linhasParaItens(rows);
  }

  function tabelaTextoItens(itens, modelo){
    if(!itens.length) return modelo === 'material'
      ? '[adicione os insumos ou importe uma planilha XLSX/CSV]'
      : '[adicione os serviços/itens ou importe uma planilha XLSX/CSV]';

    const headers = modelo === 'material'
      ? ['Descrição','Und','Qtde','V.Unit.','Valor Total']
      : ['Seq','Descrição','Und','Qtde','V.Unit.','Valor Total'];

    const linhas = itens.map((it, idx) => modelo === 'material'
      ? [it.descricao, it.unidade, it.quantidade, moneyBR(it.valorUnitario), moneyBR(it.valorTotal)]
      : [String(idx + 1), it.descricao, it.unidade, it.quantidade, moneyBR(it.valorUnitario), moneyBR(it.valorTotal)]
    );

    const all = [headers, ...linhas];
    const widths = headers.map((_, i) => Math.min(46, Math.max(...all.map(r => String(r[i] ?? '').length))));
    const fmt = (r) => r.map((v,i) => String(v ?? '').slice(0, widths[i]).padEnd(widths[i], ' ')).join(' | ');
    return [fmt(headers), widths.map(w => '-'.repeat(w)).join('-|-'), ...linhas.map(fmt)].join('\n');
  }

  function siteServicoTexto(){
    const sel = $('cotacaoSiteServicoSelect');
    const txt = $('cotacaoSiteServicoPreview')?.value?.trim();
    if(txt && !/^Selecione um site/i.test(txt)) return txt;
    if(sel && sel.selectedOptions && sel.selectedOptions[0] && sel.value) return sel.selectedOptions[0].textContent.trim();
    return [
      'Sigla Site: [informar]',
      'Localidade: [informar]',
      'Site Região: [informar]',
      'Município: [informar]',
      'Bairro: [informar]',
      'Endereço: [informar]',
      'CEP: [informar]',
      'Latitude: [informar]',
      'Longitude: [informar]',
      'Altitude: [informar]'
    ].join('\n');
  }

  function cnpjMaterialTexto(){
    const sel = $('cotacaoCnpjBaseSelect');
    const preview = $('cotacaoCnpjBasePreview')?.value?.trim();
    if(preview) return preview;
    const opt = sel?.selectedOptions?.[0];
    if(opt && sel.value) return `CNPJ: ${opt.dataset?.cnpj || opt.textContent.trim()}`;
    return 'CNPJ: [informar CNPJ do site/empresa]';
  }

  function renderCotacaoComItens(force){
    const modelo = $('cotacaoModelo')?.value || 'servico';
    const assunto = $('cotacaoAssunto');
    const msg = $('cotacaoMensagem');
    if(!msg) return;

    const itensTexto = tabelaTextoItens(cotacaoEstado.itens, modelo);

    if(modelo === 'material'){
      if(assunto && force !== false) assunto.value = 'Solicitação de Cotação de Material — [Nº RM / OS]';
      msg.value = `Prezado (a), bom dia!

Solicito cotação para os insumos abaixo.

Imagens dos itens e suas descrições em anexo.

${itensTexto}

${cnpjMaterialTexto()}

Atte.`;
      return;
    }

    if(assunto && force !== false) assunto.value = 'Solicitação de Cotação de Serviço — [Nº RM / OS]';
    msg.value = `Prezado (a), bom dia!

Por favor, enviar orçamento para o serviço descrito abaixo:

Observações:
[descrever observações, regra de vistoria, urgência, necessidade técnica ou orientação ao fornecedor]

${itensTexto}

Por favor, mencionar na proposta as seguintes informações:

• Nome do solicitante (comprador)
• Nome do vendedor
• Validade da proposta
• Data de entrega ou prazo de execução do serviço
• Condição de pagamento

*Condição de pagamento mínima: 35DDL

**Favor não alterar o assunto do e-mail com o Nº da RM**

Seguem os dados do site (local do serviço):

${siteServicoTexto()}

Atte.`;
  }

  function atualizarPreviewItens(){
    const preview = $('cotacaoItensPreview');
    const status = $('cotacaoItensStatus');
    const modelo = $('cotacaoModelo')?.value || 'servico';
    if(preview) preview.value = cotacaoEstado.itens.length
      ? tabelaTextoItens(cotacaoEstado.itens, modelo)
      : 'Importe um XLSX/CSV com colunas como DESCRIÇÃO, QUANTIDADE, UNIDADE, VALOR UNI e VALOR TOTAL. O arquivo precisa ter essas colunas escritas independente da ordem.';
    if(status) status.value = cotacaoEstado.itens.length
      ? `${cotacaoEstado.itens.length} item(ns) importado(s)`
      : 'Nenhum arquivo importado';
  }

  async function onArquivoItensChange(ev){
    const file = ev.target.files && ev.target.files[0];
    if(!file) return;
    const status = $('cotacaoItensStatus');
    try{
      if(status) status.value = 'Lendo arquivo...';
      const itens = await lerArquivoItens(file);
      cotacaoEstado.itens = itens;
      atualizarPreviewItens();
      renderCotacaoComItens(true);
      if(!itens.length) alert('Não encontrei itens. Confira se a planilha tem cabeçalhos como DESCRIÇÃO, QUANTIDADE, UNIDADE, VALOR UNI e VALOR TOTAL.');
    }catch(err){
      console.error(err);
      if(status) status.value = 'Erro ao importar arquivo';
      alert('Não foi possível ler o arquivo. Use XLSX/CSV com cabeçalho na primeira linha.');
    }
  }

  function initCotacaoUploadItens(){
    $('cotacaoItensArquivo')?.addEventListener('change', onArquivoItensChange);
    $('cotacaoModelo')?.addEventListener('change', () => {
      setTimeout(() => {
        atualizarPreviewItens();
        renderCotacaoComItens(true);
      }, 50);
    });
    $('cotacaoCnpjBaseSelect')?.addEventListener('change', () => setTimeout(() => renderCotacaoComItens(true), 80));
    $('cotacaoSiteServicoSelect')?.addEventListener('change', () => setTimeout(() => renderCotacaoComItens(true), 80));
    $('cotacaoSiteServicoSearch')?.addEventListener('input', () => setTimeout(() => renderCotacaoComItens(false), 180));
    window.cotacaoRenderComItens = renderCotacaoComItens;
  }

  document.addEventListener('DOMContentLoaded', () => setTimeout(initCotacaoUploadItens, 500));
})();
