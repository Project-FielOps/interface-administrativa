import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { StatusBadgeComponent } from './status-badge.component';

describe('StatusBadgeComponent', () => {
  let fixture: ComponentFixture<StatusBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [StatusBadgeComponent] }).compileComponents();
    fixture = TestBed.createComponent(StatusBadgeComponent);
  });

  it('traduz o estado e combina texto, ícone e tom semântico', () => {
    fixture.componentRef.setInput('value', 'UNDER_REVIEW');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Aguardando revisão');
    expect(fixture.nativeElement.querySelector('mat-icon').textContent).toContain('schedule');
    expect(fixture.nativeElement.querySelector('.fo-badge--warning')).toBeTruthy();
  });

  it('traduz papéis e decisões sem exibir enums da API', () => {
    fixture.componentRef.setInput('value', 'CLIENT_VIEWER');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Cliente (visualização)');
    expect(fixture.nativeElement.textContent).not.toContain('CLIENT_VIEWER');
    fixture.componentRef.setInput('value', 'REJECTED');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Reprovada');
  });
});
