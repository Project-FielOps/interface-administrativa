import { BreakpointObserver } from '@angular/cdk/layout';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../auth/auth.service';
import { ShellComponent } from './shell.component';

describe('ShellComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [
        provideRouter([]),
        {
          provide: BreakpointObserver,
          useValue: { observe: () => of({ matches: false, breakpoints: {} }) },
        },
        {
          provide: AuthService,
          useValue: { currentUser: () => null, isAdmin: () => true, logout: vi.fn() },
        },
      ],
    }).compileComponents();
  });

  it('recolhe e expande a navegação lateral no desktop', () => {
    const component = TestBed.createComponent(ShellComponent).componentInstance;
    component.toggleNavigation();
    expect(component.navigationCollapsed()).toBe(true);
    component.toggleNavigation();
    expect(component.navigationCollapsed()).toBe(false);
  });

  it('anuncia a abertura do drawer quando a navegação compacta está fechada', () => {
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.componentInstance.compactViewport.set(true);
    fixture.componentInstance.navigationOpen.set(false);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.fo-toolbar-top button').getAttribute('aria-label'),
    ).toBe('Abrir navegação');
  });
});
