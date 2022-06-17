import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent {

  credentials = {
    email: '',
    password: ''
  }

  showAlert = false
  alertMessage = 'Please wait! We are loggin you in.'
  alertColor = 'sky'
  inSubmission = false

  constructor(private auth: AngularFireAuth) { }

  async loginSubmit() {
    this.showAlert = true
    this.alertMessage = 'Please wait! We are loggin you in.'
    this.alertColor = 'sky'
    this.inSubmission = true

    try {
      await this.auth.signInWithEmailAndPassword(
        this.credentials.email,
        this.credentials.password
      )
    } catch (e) {
      this.inSubmission = false
      this.alertMessage = 'An unexpected error occured. Please try again later.'
      this.alertColor = 'red'
      console.error(e)

      return
    }
    this.alertMessage = 'Success! You are now logged in.'
    this.alertColor = 'green'
  }
}
