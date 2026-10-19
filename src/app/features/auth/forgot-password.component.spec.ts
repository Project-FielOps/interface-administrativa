import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ForgotPasswordComponent } from './forgot-password.component';
import { AuthService } from '../../core/auth/auth.service';
import { environment } from '../../../environments/environment';

describe('ForgotPasswordComponent', () => {
  it('shows the same success message for a recovery request', async () => {
    await TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent],
      providers: [AuthService, provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    const fixture = TestBed.createComponent(ForgotPasswordComponent);
    const component = fixture.componentInstance;
    const http = TestBed.inject(HttpTestingController);
    component.form.setValue({ email: 'person@example.com' });

    component.submit();

    const request = http.expectOne(`${environment.apiUrl}/auth/forgot-password`);
    request.flush({ message: 'generic' }, { status: 202, statusText: 'Accepted' });
    fixture.detectChanges();
    expect(component.submitted()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Se houver uma conta ativa');
    http.verify();
  });
});
