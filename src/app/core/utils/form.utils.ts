import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function creditOrDebitRequired(creditParameterName = 'credit', debitParameterName = 'debit'): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const credit = group.get(creditParameterName)?.value;
    const debit = group.get(debitParameterName)?.value;

    if (!credit && !debit) {
      return { creditOrDebitRequired: true };
    }

    return null;
  };
}
