# Painel de Fornecedores — Etapa 1

Versão do Painel de Fornecedores sem o antigo módulo Compras/DIFAL.

## Estrutura

Todos os arquivos estão diretamente na raiz do projeto:

```text
index.html
style.css
app.module.js
script-2.js
script-4.js
cotacao-cards.js
sites-vivo.json
bases-ability.json
README.md
```

## Alterações realizadas

- Remoção da aba Compras/DIFAL.
- Remoção do modal e das chamadas do comparativo antigo.
- Remoção do JavaScript legado do comparativo.
- Preservação das abas e funções do Painel de Fornecedores.
- Atualização da cotação de material para solicitar IBS, CBS e tributos de transição quando aplicáveis.
- Bases Vivo e Ability mantidas na raiz.

## Arquitetura dos sistemas

O futuro Comparativo de Preços não importará arquivos nem funções deste painel.

Os sistemas serão independentes e compartilharão somente:

- Firebase Authentication para login;
- Cloud Firestore para fornecedores, usuários, permissões e demais dados autorizados;
- configuração visual e funções comuns quando o Portal Geral for criado.

Fluxo previsto:

```text
Painel de Fornecedores -> Firebase <- Comparativo de Preços
                                  <- Gestão de Contratos
                                  <- Portal de Sistemas
```

O Painel cadastra e atualiza fornecedores no Firestore. O Comparativo e o Gestor de Contratos consultam essa mesma coleção diretamente, conforme as permissões do usuário.

## Publicação

Envie todos os arquivos deste projeto para a raiz do repositório no GitHub. No Vercel, use o diretório raiz como diretório de publicação.
