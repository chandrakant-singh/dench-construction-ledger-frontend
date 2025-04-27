import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { ToastService } from '../../core/services/toaster.service';
import { AuthService } from '../../core/services/auth.service';
import { LoadingButtonComponent } from '../../shared/components/loading-button/loading-button.component';

@Component({
  selector: 'app-create-supervisor',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LoadingButtonComponent],
  templateUrl: './create-supervisor.component.html',
  styleUrl: './create-supervisor.component.scss'
})
export class CreateSupervisorComponent {
  supervisorForm: FormGroup;
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private readonly toastService: ToastService,
    private authService: AuthService
  ) {
    this.supervisorForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  async onSubmit() {
    if (this.supervisorForm.invalid) return;

    const { name, email, password } = this.supervisorForm.value;

    try {
      this.isLoading = true;
      // const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);

      // const userId = userCredential.user.uid;

      // // Save name and role in Firestore
      // await setDoc(doc(this.firestore, 'users', userId), {
      //   name,
      //   email,
      //   role: 'supervisor',
      //   createdAt: new Date(),
      // });

      await this.authService.createSupervisor(name, email, password);
      // alert('Supervisor created successfully!');
      this.toastService.show('Supervisor created successfully!', 'success');
      this.supervisorForm.reset();
    } catch (error) {
      console.error('Error creating supervisor:', error);
      this.toastService.show('Failed to create supervisor!', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

}
