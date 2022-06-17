import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import IClip from 'src/app/models/clip.model';
import { ClipService } from 'src/app/services/clip.service';
import { ModalService } from 'src/app/services/modal.service';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html'
})
export class EditComponent implements OnInit, OnChanges, OnDestroy {

  @Input() activeClip: IClip | null = null
  @Output() onChange = new EventEmitter()

  clipId = new FormControl('')
  title = new FormControl('', [Validators.required, Validators.minLength(1)])

  editForm = new FormGroup({
    title: this.title
  })

  showAlert = false
  alertMessage = 'Please wait! Updating clip.'
  alertColor = 'sky'
  inSubmission = false

  constructor(
    private modalService: ModalService,
    private clipService: ClipService
  ) { }

  ngOnInit(): void {
    this.modalService.register('editClip')
  }

  ngOnChanges(): void {
    if (!this.activeClip) {
      return
    }
    this.inSubmission = false
    this.showAlert = false
    this.clipId.setValue(this.activeClip.docId)
    this.title.setValue(this.activeClip.title)
  }

  ngOnDestroy(): void {
    this.modalService.unregister('editClip')
  }

  async editSubmit() {
    if (!this.activeClip) {
      return
    }

    this.editForm.disable()

    this.showAlert = true
    this.alertMessage = 'Please wait! Updating clip.'
    this.alertColor = 'sky'
    this.inSubmission = true
    try {
      await this.clipService.updateClip(
        this.clipId.value,
        this.title.value
      )
    } catch (error) {
      this.editForm.enable()
      this.alertColor = 'red'
      this.alertMessage = 'Something went wrong. Please try again later.'
      this.inSubmission = false
      console.error(error)

      return
    }

    this.activeClip.title = this.title.value
    this.onChange.emit(this.activeClip)

    this.alertColor = 'green'
    this.inSubmission = false
    this.alertMessage = 'Success!'
  }
}
