/* Alternância visual entre os cards de Serviço e Material. */
(function(){
  const get = id => document.getElementById(id);

  function selecionarTipoCotacao(tipo, aplicarModelo = true){
    const modelo = get('cotacaoModelo');
    const servico = get('cotacaoServicoBox');
    const material = get('cotacaoCnpjBaseBox');

    if(modelo) modelo.value = tipo;

    document.querySelectorAll('[data-cotacao-type]').forEach(card => {
      card.classList.toggle('active', card.dataset.cotacaoType === tipo);
      card.setAttribute('aria-pressed', card.dataset.cotacaoType === tipo ? 'true' : 'false');
    });

    if(servico){
      servico.hidden = tipo !== 'servico';
      servico.style.display = tipo === 'servico' ? 'block' : 'none';
    }
    if(material){
      material.hidden = tipo !== 'material';
      material.style.display = tipo === 'material' ? 'block' : 'none';
    }

    if(modelo){
      modelo.dispatchEvent(new Event('change', { bubbles:true }));
    } else if(aplicarModelo && typeof window.cotacaoAplicarModelo === 'function') {
      window.cotacaoAplicarModelo(true);
    }
  }

  function iniciarCardsCotacao(){
    document.querySelectorAll('[data-cotacao-type]').forEach(card => {
      card.addEventListener('click', () => selecionarTipoCotacao(card.dataset.cotacaoType));
    });
    selecionarTipoCotacao(get('cotacaoModelo')?.value || 'servico', false);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciarCardsCotacao);
  else iniciarCardsCotacao();

  window.selecionarTipoCotacao = selecionarTipoCotacao;
})();
