import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../auth/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
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

  logout(): void {
    this.auth.logout();
  }

  goToDashboard(): void {
    this.router.navigate(['/app/dashboard']);
  }
}
