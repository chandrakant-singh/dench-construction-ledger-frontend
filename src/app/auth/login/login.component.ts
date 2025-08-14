import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toaster.service';
import { HttpErrorResponse } from '@angular/common/http';
import { LoadingButtonComponent } from '../../shared/components/loading-button/loading-button.component';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LoadingButtonComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading: boolean = false;
  showPassword: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private readonly toastService: ToastService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      console.log('Login Data:', this.loginForm.value);
      // Call login service here
      this.logIn(this.loginForm.value.email, this.loginForm.value.password);
    }
  }

  logIn(email: string, password: string) {
    this.isLoading = true;
    this.authService.login(email, password)
      .then((res) => {
        console.log(res);
        this.toastService.show('Login successful', 'success');
      })
      .catch((err: HttpErrorResponse) => {
        console.log(err.message);
        this.toastService.show('Invalid credentials', 'danger');
      })
      .finally(() => {
        console.log('finally');
        this.isLoading = false;
      });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}
