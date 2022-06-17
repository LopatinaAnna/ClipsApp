import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html'
})
export class AlertComponent {

  @Input() color = 'sky'

  get bgColor() {
    return `bg-${this.color}-400`
  }
}
