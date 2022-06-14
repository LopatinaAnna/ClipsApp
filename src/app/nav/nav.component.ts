import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { ModalService } from '../services/modal.service';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html'
})
export class NavComponent implements OnInit {

  constructor(
    public modalService: ModalService,
    public authService: AuthService
  ) { }

  ngOnInit(): void {
  }

  openModal($event: Event) {
    $event.preventDefault()
    this.modalService.toggleModal('auth')
  }

  async logout($event: Event) {
    await this.authService.logout($event)
  }
}
