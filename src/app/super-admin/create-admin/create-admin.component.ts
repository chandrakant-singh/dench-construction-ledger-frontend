import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { ToastService } from '../../core/services/toaster.service';
import { AuthService } from '../../core/services/auth.service';
import { LoadingButtonComponent } from '../../shared/components/loading-button/loading-button.component';

@Component({
  selector: 'app-create-admin',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LoadingButtonComponent],
  templateUrl: './create-admin.component.html',
  styleUrl: './create-admin.component.scss'
})
export class CreateAdminComponent {
  adminForm: FormGroup;
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private readonly toastService: ToastService,
    private authService: AuthService
  ) {
    this.adminForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  async onSubmit() {
    if (this.adminForm.invalid) return;

    const { name, email, password } = this.adminForm.value;

    try {
      this.isLoading = true;
      await this.authService.createAdmin(name, email, password);
      this.toastService.show('Admin created successfully!', 'success');
      this.adminForm.reset();
    } catch (error) {
      console.error('Error creating admin:', error);
      this.toastService.show('Failed to create admin!', 'danger');
    } finally {
      this.isLoading = false;
    }
  }
}
