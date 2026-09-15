import { Pipe, PipeTransform } from '@angular/core';

/**
 * Traduz os enums do backend para rótulos de interface em pt-BR.
 *
 * As telas exibiam o valor cru da API (ADMIN, UNDER_REVIEW, CRITICAL) no meio de
 * uma interface em português. O pipe é puro e só mapeia texto — o valor original
 * continua sendo o que trafega para a API em filtros e formulários.
 */
const LABELS: Record<string, string> = {
  // Perfis de usuário
  ADMIN: 'Administrador',
  SUPERVISOR: 'Supervisor',
  TECHNICIAN: 'Técnico',
  CLIENT_VIEWER: 'Cliente',

  // Situação de cadastro
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  BLOCKED: 'Bloqueado',

  // Ciclo de vida da inspeção
  DRAFT: 'Rascunho',
  ASSIGNED: 'Atribuída',
  IN_PROGRESS: 'Em andamento',
  SUBMITTED: 'Enviada',
  UNDER_REVIEW: 'Em revisão',
  APPROVED: 'Aprovada',
  REJECTED: 'Reprovada',
  CANCELED: 'Cancelada',

  // Prioridade e severidade
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',

  // Situação de modelo de inspeção
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Arquivado',

  // Situação de não conformidade
  OPEN: 'Aberta',
  RESOLVED: 'Resolvida',
  CLOSED: 'Fechada',
};

@Pipe({ name: 'foLabel', standalone: true })
export class FoLabelPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '-';
    return LABELS[value] ?? value;
  }
}
