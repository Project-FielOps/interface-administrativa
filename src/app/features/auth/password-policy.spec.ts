import { FormControl, FormGroup } from '@angular/forms';
import { matchingPasswordValidator, strongPasswordValidator } from './password-policy';

describe('password policy', () => {
  it('requires a strong password', () => {
    expect(strongPasswordValidator(new FormControl('weak-password'))).toEqual({
      weakPassword: true,
    });
    expect(strongPasswordValidator(new FormControl('Strong@123'))).toBeNull();
  });

  it('requires confirmation to match', () => {
    const form = new FormGroup({
      newPassword: new FormControl('Strong@123'),
      confirmation: new FormControl('Different@123'),
    });
    expect(matchingPasswordValidator('newPassword', 'confirmation')(form)).toEqual({
      passwordMismatch: true,
    });
  });
});
