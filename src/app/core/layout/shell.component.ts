import { Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreakpointObserver } from '@angular/cdk/layout';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../auth/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  adminOnly?: boolean;
  section: 'Visão geral' | 'Operação' | 'Configuração';
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
    MatTooltipModule,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly breakpointObserver = inject(BreakpointObserver);
  readonly compactViewport = signal(false);
  readonly navigationOpen = signal(true);
  readonly navigationCollapsed = signal(false);
  readonly sections = ['Visão geral', 'Operação', 'Configuração'] as const;
  readonly navItems: NavItem[] = [
    {
      label: 'Dashboard',
      icon: 'space_dashboard',
      route: '/app/dashboard',
      section: 'Visão geral',
    },
    { label: 'Inspeções', icon: 'assignment', route: '/app/inspections', section: 'Operação' },
    {
      label: 'Não conformidades',
      icon: 'report_problem',
      route: '/app/non-conformities',
      section: 'Operação',
    },
    { label: 'Clientes', icon: 'business', route: '/app/clients', section: 'Configuração' },
    { label: 'Locais', icon: 'location_on', route: '/app/sites', section: 'Configuração' },
    {
      label: 'Equipamentos',
      icon: 'precision_manufacturing',
      route: '/app/equipment',
      section: 'Configuração',
    },
    {
      label: 'Modelos de inspeção',
      icon: 'fact_check',
      route: '/app/inspection-templates',
      section: 'Configuração',
    },
    {
      label: 'Usuários',
      icon: 'group',
      route: '/app/users',
      adminOnly: true,
      section: 'Configuração',
    },
    { label: 'Auditoria', icon: 'history', route: '/app/audit', section: 'Configuração' },
  ];

  constructor(
    readonly auth: AuthService,
    private readonly router: Router,
  ) {
    this.breakpointObserver
      .observe('(max-width: 1023px)')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ matches }) => {
        this.compactViewport.set(matches);
        this.navigationOpen.set(!matches);
        if (matches) this.navigationCollapsed.set(false);
      });
  }

  get visibleNavItems(): NavItem[] {
    return this.navItems.filter((item) => !item.adminOnly || this.auth.isAdmin());
  }

  itemsFor(section: NavItem['section']): NavItem[] {
    return this.visibleNavItems.filter((item) => item.section === section);
  }
  roleLabel(role: string): string {
    return (
      (
        { ADMIN: 'Administrador', SUPERVISOR: 'Supervisor', TECHNICIAN: 'Técnico' } as Record<
          string,
          string
        >
      )[role] || role
    );
  }
  toggleNavigation(): void {
    if (this.compactViewport()) this.navigationOpen.update((open) => !open);
    else this.navigationCollapsed.update((collapsed) => !collapsed);
  }
  closeCompactNavigation(): void {
    if (this.compactViewport()) this.navigationOpen.set(false);
  }

  logout(): void {
    this.auth.logout();
  }

  goToDashboard(): void {
    this.router.navigate(['/app/dashboard']);
  }
}
