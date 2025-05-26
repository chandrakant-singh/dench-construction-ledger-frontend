import { Component } from '@angular/core';

import { SupervisorService } from '../../core/services/supervisor.service';
import { CommonModule } from '@angular/common';
import { AppUser } from '../../core/models/user.model';

@Component({
  selector: 'app-list-supervisor',
  imports: [CommonModule],
  templateUrl: './list-supervisor.component.html',
  styleUrl: './list-supervisor.component.scss'
})
export class ListSupervisorComponent {
  supervisors: AppUser[] = [];

  constructor(private supervisorService: SupervisorService) {
  }

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    this.getSupervisors();
  }

  private getSupervisors(): void {
    this.supervisorService.getSupervisors()
    .subscribe({
      next: (supervisors) => {
        console.log(supervisors);
        this.supervisors =  supervisors;
      },
      error: (error) => {
        console.error('Error fetching supervisors:', error);
      }
    })
  }
}
