# Painel de Fornecedores — Cadastro, Cotações e Compras/DIFAL

Sistema web interno em arquivo único (`index.html`) para gestão de fornecedores, acompanhamento documental, cotações, comparativos de preço e fluxo de Compras/DIFAL.

> Projeto Firebase identificado no código: `fornecedores-cp`  

---

## Visão geral

O painel centraliza rotinas operacionais de cadastro e análise de fornecedores, com foco em:

- cadastro e manutenção de fornecedores;
- acompanhamento de etapas do processo;
- gestão de documentos obrigatórios;
- controle de acessos por perfil;
- geração de cotações por e-mail;
- leitura de planilhas XLSX/CSV;
- comparação de orçamentos;
- apoio ao cálculo/análise de Compras e DIFAL;
- logs e rastreabilidade básica das alterações.

---

## Módulos principais

| Módulo | Finalidade |
|---|---|
| **Dashboard** | Visão geral dos fornecedores, status e indicadores. |
| **Cadastro** | Inclusão e edição de fornecedores, dados fiscais, escopos, segmentos e documentos. |
| **Acompanhamento** | Controle das etapas do processo de cadastro/homologação. |
| **Tipos de Serviço** | Organização dos tipos de serviço e regras relacionadas. |
| **Checklist** | Conferência documental por fornecedor e segmento. |
| **Acessos** | Controle de usuários e perfis de acesso. |
| **Cotações** | Geração de modelos de e-mail para serviço/material, seleção de fornecedor/base e apoio por planilha. |
| **Compras / DIFAL** | Importação de orçamentos, comparação de preços, ranking de fornecedores e apoio à tomada de decisão. |

---

## Tecnologias utilizadas

- **HTML5**
- **CSS3**
- **JavaScript Vanilla**
- **Firebase App**
- **Firebase Authentication**
- **Cloud Firestore**
- **Firebase Analytics**
- **SheetJS / XLSX** para leitura de planilhas

Dependência externa carregada via CDN:

```html
https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js
```

SDKs Firebase usados no código:

- `firebase-app.js`
- `firebase-analytics.js`
- `firebase-auth.js`
- `firebase-firestore.js`

---

## Estrutura atual do projeto

```text
/
├── index.html
├── style.css
├── app.module.js
├── script-2.js
├── script-3.js
├── script-4.js
├── cotacao-cards.js
├── sites-vivo.json
├── bases-ability.json
└── README.md
```

O sistema está concentrado em um único arquivo HTML, contendo:

- marcação HTML;
- estilos CSS;
- regras visuais por aba;
- scripts JavaScript;
- integração Firebase;
- lógica de importação XLSX/CSV;
- regras de permissões e telas.

---

## Configuração Firebase encontrada

O sistema usa Firebase com:

| Recurso | Uso no sistema |
|---|---|
| **Firebase Auth** | Login, autenticação, criação de usuários e controle de sessão. |
| **Cloud Firestore** | Persistência dos cadastros, usuários, serviços e logs. |
| **Firebase Analytics** | Inicialização condicional de analytics. |

Coleções identificadas no código:

```text
fornecedores
servicos
usuarios
usuariosUid
logs
```

---

## Perfis de acesso

Perfis identificados na aplicação:

| Perfil | Permissão esperada |
|---|---|
| **Compras** | Acesso completo às rotinas operacionais. |
| **RH** | Aprovação/validação relacionada ao fluxo RH. |
| **SESMT** | Aprovação/validação de segurança e documentação técnica. |
| **Jurídico** | Aprovação/validação jurídica. |
| **Diretoria** | Aprovação em etapa de alçada superior. |
| **Solicitante** | Visualização limitada. |


## Bases externas da aba Cotações

As listas de sites VIVO e bases/CNPJs Ability foram retiradas do `index.html` e do JavaScript principal. Elas agora ficam em:

- `sites-vivo.json`
- `bases-ability.json`

O arquivo `script-3.js` carrega essas bases com `fetch()` ao iniciar a página. Para testar localmente, abra o projeto usando um servidor HTTP, como a extensão Live Server do VS Code. Abrir o `index.html` diretamente por `file://` pode bloquear o carregamento dos arquivos JSON.

Os cards **Cotação de Serviço** e **Cotação de Material** foram compactados. Ao selecionar um tipo, somente o painel correspondente permanece visível.


## Busca otimizada de sites Vivo

- A base Vivo não é carregada ao abrir o painel.
- O carregamento ocorre somente na primeira pesquisa com pelo menos 3 caracteres.
- Há atraso de 350 ms entre a digitação e a busca para evitar pesquisas repetidas.
- São exibidos no máximo 10 sites por pesquisa.
- Os arquivos JSON ficam na raiz do projeto, sem a pasta `data`.
