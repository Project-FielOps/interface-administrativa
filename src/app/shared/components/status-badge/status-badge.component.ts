import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

const LABELS: Record<string, string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  BLOCKED: 'Bloqueado',
  DECOMMISSIONED: 'Fora de uso',
  DRAFT: 'Rascunho',
  ASSIGNED: 'Atribuída',
  IN_PROGRESS: 'Em andamento',
  SUBMITTED: 'Enviada',
  UNDER_REVIEW: 'Aguardando revisão',
  APPROVED: 'Aprovada',
  REJECTED: 'Reprovada',
  CANCELED: 'Cancelada',
  OPEN: 'Aberta',
  RESOLVED: 'Resolvida',
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
  ADMIN: 'Administrador',
  SUPERVISOR: 'Supervisor',
  TECHNICIAN: 'Técnico',
  CLIENT_VIEWER: 'Cliente (visualização)',
  ACCEPTED: 'Aprovada',
  APPROVE: 'Aprovada',
  REJECT: 'Reprovada',
};
const TONES: Record<string, string> = {
  ACTIVE: 'success',
  APPROVED: 'success',
  RESOLVED: 'success',
  SUBMITTED: 'warning',
  UNDER_REVIEW: 'warning',
  MEDIUM: 'warning',
  REJECTED: 'error',
  BLOCKED: 'error',
  CRITICAL: 'error',
  HIGH: 'error',
  IN_PROGRESS: 'info',
  ASSIGNED: 'info',
  OPEN: 'info',
  ACCEPTED: 'success',
  APPROVE: 'success',
  REJECT: 'error',
};

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [MatIconModule],
  template: `<span class="fo-badge" [class]="'fo-badge fo-badge--' + tone"
    ><mat-icon aria-hidden="true">{{ icon }}</mat-icon
    ><span>{{ label }}</span></span
  >`,
  styles: [
    `
      .fo-badge {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        min-height: 26px;
        padding: 3px 10px;
        border-radius: 999px;
        color: var(--fo-text-secondary);
        background: var(--fo-surface-secondary);
        font-size: 12px;
        font-weight: 700;
        line-height: 18px;
        white-space: nowrap;
      }
      mat-icon {
        width: 16px;
        height: 16px;
        font-size: 16px;
      }
      .fo-badge--success {
        color: var(--fo-success);
        background: var(--fo-success-soft);
      }
      .fo-badge--warning {
        color: var(--fo-warning);
        background: var(--fo-warning-soft);
      }
      .fo-badge--error {
        color: var(--fo-error);
        background: var(--fo-error-soft);
      }
      .fo-badge--info {
        color: var(--fo-info);
        background: var(--fo-info-soft);
      }
    `,
  ],
})
export class StatusBadgeComponent {
  @Input({ required: true }) value = '';
  get label(): string {
    return LABELS[this.value] || this.value;
  }
  get tone(): string {
    return TONES[this.value] || 'neutral';
  }
  get icon(): string {
    return this.tone === 'success'
      ? 'check_circle'
      : this.tone === 'warning'
        ? 'schedule'
        : this.tone === 'error'
          ? 'error'
          : this.tone === 'info'
            ? 'info'
            : 'circle';
  }
}
