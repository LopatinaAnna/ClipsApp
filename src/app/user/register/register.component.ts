import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
import { RegisterValidators } from '../validators/register-validators';
import { EmailTaken } from '../validators/email-taken';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html'
})
export class RegisterComponent {

  constructor(
    private auth: AuthService,
    private emailTaken: EmailTaken
  ) { }

  name = new FormControl('', [Validators.required, Validators.minLength(3)])
  email = new FormControl('', [Validators.required, Validators.email], [this.emailTaken.validate])
  age = new FormControl('', [Validators.required, Validators.min(18), Validators.max(120)])
  password = new FormControl('', [Validators.required, Validators.pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/gm)])
  confirm_password = new FormControl('', [Validators.required])
  phoneNumber = new FormControl('', [Validators.required, Validators.minLength(10), Validators.maxLength(10)])

  showAlert = false
  alertMessage = 'Please wait! Your account is being created.'
  alertColor = 'sky'
  inSubmission = false

  registerForm: FormGroup = new FormGroup({
    name: this.name,
    email: this.email,
    age: this.age,
    password: this.password,
    confirm_password: this.confirm_password,
    phoneNumber: this.phoneNumber
  }, [RegisterValidators.match('password', 'confirm_password')])

  async registerSubmit() {
    this.showAlert = true
    this.alertMessage = 'Please wait! Your account is being created.'
    this.alertColor = 'sky'
    this.inSubmission = true

    try {
      this.auth.createUser(this.registerForm.value)
    } catch (e) {
      this.showAlert = true
      this.alertMessage = 'An unexpected error occured. Please try again later.'
      this.alertColor = 'red'
      this.inSubmission = false

      console.error(e)

      return
    }

    this.alertMessage = 'Success! Your account has been created.'
    this.alertColor = 'green'
  }
}
