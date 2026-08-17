# FieldOps — Interface Administrativa Web

Aplicação Angular (standalone components, sem NgModules) para administração da plataforma FieldOps:
cadastros de clientes/locais/equipamentos, gestão de usuários, construção de modelos de inspeção
(checklists versionados), planejamento e acompanhamento de inspeções, revisão de supervisores,
não conformidades e auditoria.

> **Nota sobre a especificação**: o documento fornecido em `docs/fieldops-spec.md` continha apenas a
> seção 10 (Modelo de Dados). As seções 11 (Arquitetura), 12 (API REST), 14 (Interface Administrativa)
> e 17-19 (critérios de aceite/avaliação) mencionadas no briefing não estavam presentes no arquivo.
> Este projeto foi construído seguindo fielmente o mapa de navegação, as regras de tela e o contrato
> de API descritos no próprio briefing da tarefa (que reproduzia esses trechos), complementados por
> convenções REST padrão coerentes com o modelo de dados da seção 10. Os endpoints exatos devem ser
> conferidos contra a implementação real do `fieldops-api` e ajustados nos serviços em
> `src/app/features/*/*.service.ts` caso divirjam.

## Como rodar

```bash
npm install
npm start        # ng serve — http://localhost:4200
```

## Configuração da URL da API

A URL base da API é configurada nos arquivos de ambiente:

- `src/environments/environment.ts` (desenvolvimento, usado por `ng serve`)
- `src/environments/environment.prod.ts` (produção, usado por `ng build`)

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/v1',
};
```

## Build de produção

```bash
npm run build     # ng build --configuration production
```

Gera os artefatos em `dist/fieldops-admin/`. O build de produção foi validado sem erros.

## Autenticação e armazenamento de tokens

- **Access token**: mantido apenas em memória (`TokenStorageService`), nunca em `localStorage`/
  `sessionStorage`. Isso reduz a superfície de um ataque XSS que tente ler dados persistidos — o
  token desaparece a cada reload da página.
- **Refresh token**: mantido em `sessionStorage`, para permitir sobreviver a um reload de página sem
  forçar novo login, mas é limpo ao fechar a aba/navegador (diferente de `localStorage`, que
  persistiria indefinidamente).
- Um interceptor HTTP (`core/interceptors/auth.interceptor.ts`) anexa `Authorization: Bearer <token>`
  em toda requisição autenticada e, ao receber `401`, tenta uma única renovação via
  `POST /auth/refresh` antes de redirecionar para `/login`.
- Um segundo interceptor (`core/interceptors/error.interceptor.ts`) centraliza feedback de erros de
  rede, sessão expirada, permissão negada e erros de servidor via snackbar.

## Estrutura

```
src/app/
  core/
    auth/          AuthService, TokenStorageService
    guards/         authGuard, roleGuard (ADMIN/SUPERVISOR/...)
    interceptors/   auth.interceptor, error.interceptor
    http/           CrudService (base REST genérica) 
    layout/         ShellComponent (sidenav + header + navegação por perfil)
    models/         DTOs/interfaces tipadas conforme o modelo de dados
  shared/
    components/
      state-container/   wrapper reutilizável para loading/erro/vazio/conteúdo
      confirm-dialog/    diálogo genérico de confirmação (com motivo obrigatório opcional)
      page-header/       cabeçalho de página padrão
  features/
    auth/            tela de login
    dashboard/        indicadores e atalhos
    users/            gestão de usuários (ADMIN only)
    clients/          clientes + drill-down para locais
    sites/             locais + drill-down para equipamentos
    equipment/         equipamentos + busca por QR code
    templates/          construtor de modelos de inspeção (seções/itens/publicação/versões)
    inspections/        planejamento, listagem, detalhe e revisão de inspeções
    non-conformities/   listagem de não conformidades
    audit/               trilha de auditoria (somente leitura)
```

## Telas implementadas

| Rota | Descrição |
|---|---|
| `/login` | Login com e-mail/senha, validação reativa, tratamento de erro de rede/credenciais |
| `/app/dashboard` | Cards de inspeções por status, atrasadas, aguardando revisão, não conformidades por severidade, atalhos |
| `/app/users` | Lista/filtro (nome, perfil, status), criar/editar, ativar/inativar/bloquear, redefinir senha (ADMIN) |
| `/app/clients` | Lista/filtro, criar/editar, ativar/inativar |
| `/app/clients/:clientId/sites` | Locais do cliente |
| `/app/sites` | Lista/filtro de locais, criar/editar, ativar/inativar |
| `/app/sites/:siteId/equipment` | Equipamentos do local |
| `/app/equipment` | Lista/filtro, criar/editar, busca por QR code, ativar/inativar/desativar |
| `/app/inspection-templates` | Lista de modelos, filtro por status/categoria |
| `/app/inspection-templates/new` | Criação do rascunho (título/descrição/categoria) |
| `/app/inspection-templates/:id/edit` | Construtor: seções e itens (adicionar/editar/remover/reordenar), tipos de resposta, alternativas para escolha única, toggles de obrigatoriedade/observação/evidência, publicação |
| `/app/inspection-templates/:id/preview` | Pré-visualização somente leitura do checklist |
| `/app/inspection-templates/:id/versions` | Histórico de versões publicadas |
| `/app/inspections` | Lista com filtros (status, técnico, cliente, prioridade, período, atrasadas, aguardando revisão), cancelamento com motivo |
| `/app/inspections/new` | Agendamento com selects em cascata cliente → local → equipamento, técnico/supervisor, prioridade, data |
| `/app/inspections/:id` | Detalhe: cabeçalho, checklist respondido (somente leitura), histórico de revisões |
| `/app/inspections/:id/review` | Tela de revisão: respostas do técnico em modo somente leitura (o supervisor não pode editá-las), não conformidades, histórico de ciclos, ações Aprovar/Reprovar (reprovar exige motivo) |
| `/app/non-conformities` | Lista filtrável por severidade/inspeção, com evidências e item relacionado |
| `/app/audit` | Trilha de auditoria somente leitura, filtrável por entidade/período |

## Simplificações conscientes

- **Reordenação de seções/itens** usa botões mover-para-cima/baixo (não drag-and-drop), conforme
  indicado como aceitável no próprio escopo da tarefa.
- **Upload de evidências (fotos)** não foi implementado nesta interface administrativa: o modelo de
  dados prevê que evidências são capturadas no app mobile; a interface web apenas as **exibe** (contagem
  e metadados) nas telas de detalhe/revisão/não conformidades, sem endpoint de upload.
- **Reset de senha** assume que o backend retorna uma senha temporária ou dispara e-mail; a tela trata
  ambos os casos genericamente.
- **Auditoria** foi mantida deliberadamente enxuta (tabela + filtros por entidade/período), conforme
  indicado no briefing ("básico, não profundamente especificado").
- Os **endpoints REST exatos** (paths, nomes de parâmetros) foram inferidos a partir do modelo de
  dados e das convenções indicadas no briefing, já que a especificação completa da seção 12 não estava
  disponível no arquivo fonte. Ajustar `environment.apiUrl` e os serviços em `features/*/*.service.ts`
  caso o contrato real do `fieldops-api` divirja em algum path.

## Qualidade

- TypeScript modo estrito, componentes standalone, roteamento lazy-loaded por feature.
- Formulários reativos com validação síncrona e exibição de erros de campo vindos da API
  (`fieldErrors` do corpo de erro padrão).
- Estados de UI consistentes (loading/erro/vazio/conteúdo) via `<app-state-container>`, reutilizado
  em todas as telas de dados.
- `ng build` (produção) validado sem erros nem warnings de budget.
