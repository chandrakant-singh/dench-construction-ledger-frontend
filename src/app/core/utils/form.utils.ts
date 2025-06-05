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

export function balanceLedgerFormValidation(
  creditField = 'credit',
  quantityField = 'quantity',
  rateField = 'rate',
): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const credit = group.get(creditField)?.value;
    const quantity = group.get(quantityField)?.value;
    const rate = group.get(rateField)?.value;

    const hasCredit = !!credit;
    const hasAllTheQuantityFields = !!quantity && !!rate;

    if (!hasCredit && !hasAllTheQuantityFields) {
      return {
        creditOrQuantityFieldsRequired: true
      };
    }

    return null;
  };
}
