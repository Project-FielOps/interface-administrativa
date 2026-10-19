import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { ResetPasswordComponent } from './reset-password.component';
import { AuthService } from '../../core/auth/auth.service';
import { environment } from '../../../environments/environment';

describe('ResetPasswordComponent', () => {
  it('consumes the token from the query string and sends it only in the reset request', async () => {
    await TestBed.configureTestingModule({
      imports: [ResetPasswordComponent],
      providers: [
        AuthService,
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: new URLSearchParams('token=opaque-token') } },
        },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ResetPasswordComponent);
    const component = fixture.componentInstance;
    const http = TestBed.inject(HttpTestingController);
    component.ngOnInit();
    component.form.setValue({ newPassword: 'Strong@123', confirmation: 'Strong@123' });

    component.submit();

    const request = http.expectOne(`${environment.apiUrl}/auth/reset-password`);
    expect(request.request.body).toEqual({ token: 'opaque-token', newPassword: 'Strong@123' });
    request.flush(null);
    expect(component.completed()).toBe(true);
    http.verify();
  });
});
