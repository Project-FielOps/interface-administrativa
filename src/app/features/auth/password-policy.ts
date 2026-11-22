import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const PASSWORD_POLICY_MESSAGE =
  'Use ao menos 8 caracteres, com maiúscula, minúscula, número e símbolo.';

export const strongPasswordValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = String(control.value ?? '');
  if (!value) return null;
  const strong =
    value.length >= 8 &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /\d/.test(value) &&
    /[^A-Za-z0-9]/.test(value);
  return strong ? null : { weakPassword: true };
};

export const matchingPasswordValidator =
  (passwordControlName: string, confirmationControlName: string): ValidatorFn =>
  (control: AbstractControl): ValidationErrors | null => {
    const password = control.get(passwordControlName)?.value;
    const confirmation = control.get(confirmationControlName)?.value;
    if (!password || !confirmation) return null;
    return password === confirmation ? null : { passwordMismatch: true };
  };
