import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function creditOrDebitRequired(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const credit = group.get('credit')?.value;
    const debit = group.get('debit')?.value;

    if (!credit && !debit) {
      return { creditOrDebitRequired: true };
    }

    return null;
  };
}
