import { Component, EventEmitter, Input, Output, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-unit-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './unit-selector.component.html',
  styleUrls: ['./unit-selector.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UnitSelectorComponent),
      multi: true
    }
  ]
})
export class UnitSelectorComponent implements ControlValueAccessor {
  @Input() units: string[] = ['kg', 'g', 'l', 'ml', 'pcs', 'box', 'bag', 'm', 'ft', 'sqft'];
  @Input() selectedUnit: string = 'pcs';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() variant: 'inline' | 'dropdown' = 'dropdown';
  @Input() disabled: boolean = false;
  @Input() placeholder: string = 'Select Unit';

  @Output() unitChange = new EventEmitter<string>();

  private onChange = (value: string) => {};
  private onTouched = () => {};

  onUnitSelect(unit: string): void {
    if (this.disabled) return;
    
    this.selectedUnit = unit;
    this.onChange(unit);
    this.onTouched();
    this.unitChange.emit(unit);
  }

  onSelectChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target && target.value) {
      this.onUnitSelect(target.value);
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.selectedUnit = value || 'pcs';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
