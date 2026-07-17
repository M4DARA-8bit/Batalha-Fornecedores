# Painel de Fornecedores — versão final integrada

Sistema de cadastro, documentação, acompanhamento e cotação de fornecedores.

## Endereços

- Direto: `https://painel-fornecedores-ability.vercel.app`
- Pelo Portal: `https://portal-compras-flax.vercel.app/fornecedores/`

## Autenticação

- Pelo Portal: utiliza a sessão já aberta e não solicita novo login.
- Pelo endereço direto: exige e-mail e senha do Firebase Authentication.
- A sessão expira após duas horas.
- As permissões são consultadas em `usuariosUid/{uid}`.

## Controle de acessos

O controle local foi retirado. Este sistema não cria usuários nem altera permissões. Todas as funções são gerenciadas exclusivamente no Portal de Compras.

Mapeamento aplicado:

- Visualizador: consulta sem edição.
- Editor: edição operacional.
- Aprovador: edição e aprovações disponíveis no módulo.
- Administrador: acesso operacional completo, sem administração de usuários.

## Principais ajustes

- Remoção definitiva do antigo Compras/DIFAL.
- Cotação preparada para IBS, CBS e tributos de transição quando aplicáveis.
- Botão para retorno ao Portal.
- Login centralizado no Firebase.
- Bases Vivo e Ability mantidas na raiz.

## Arquivos

```text
index.html
style.css
app.module.js
script-2.js
script-4.js
cotacao-cards.js
sites-vivo.json
bases-ability.json
vercel.json
README.md
```

## Publicação

Envie todos os arquivos para a raiz do repositório e publique no Vercel sem comando de build. Mantenha o domínio em Firebase Authentication → Authorized domains.
