import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../auth/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  adminOnly?: boolean;
}

/** Rótulos de perfil em português, para o badge do topo não exibir o enum cru. */
const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  SUPERVISOR: 'Supervisor',
  TECHNICIAN: 'Técnico',
  CLIENT_VIEWER: 'Cliente',
};

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/app/dashboard' },
    { label: 'Usuários', icon: 'people', route: '/app/users', adminOnly: true },
    { label: 'Clientes', icon: 'business', route: '/app/clients' },
    { label: 'Locais', icon: 'place', route: '/app/sites' },
    { label: 'Equipamentos', icon: 'precision_manufacturing', route: '/app/equipment' },
    { label: 'Modelos de Inspeção', icon: 'fact_check', route: '/app/inspection-templates' },
    { label: 'Inspeções', icon: 'assignment', route: '/app/inspections' },
    { label: 'Não Conformidades', icon: 'report_problem', route: '/app/non-conformities' },
    { label: 'Auditoria', icon: 'history', route: '/app/audit' },
  ];

  constructor(readonly auth: AuthService, private readonly router: Router) {}

  get visibleNavItems(): NavItem[] {
    return this.navItems.filter((item) => !item.adminOnly || this.auth.isAdmin());
  }

  /** Iniciais para o avatar do topo (primeiro e último nome). */
  initials(name: string): string {
    const parts = (name || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    const first = parts[0][0];
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase();
  }

  roleLabel(role: string): string {
    return ROLE_LABELS[role] || role;
  }

  logout(): void {
    this.auth.logout();
  }

  goToDashboard(): void {
    this.router.navigate(['/app/dashboard']);
  }
}
