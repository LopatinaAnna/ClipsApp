import { Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AngularFireStorage, AngularFireUploadTask } from '@angular/fire/compat/storage';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app'
import { v4 as uuid } from 'uuid'
import { last, switchMap } from 'rxjs';
import { ClipService } from 'src/app/services/clip.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html'
})
export class UploadComponent implements OnDestroy {

  isDragover = false
  file: File | null = null
  nextStep = false

  showAlert = false
  alertMessage = 'Please wait! Your clip is being uploaded.'
  alertColor = 'sky'
  inSubmission = false

  percentage = 0
  showPercentage = false

  user: firebase.User | null = null

  task?: AngularFireUploadTask

  title = new FormControl('', [Validators.required, Validators.minLength(1)])
  uploadForm = new FormGroup({
    title: this.title
  })

  constructor(
    private storage: AngularFireStorage,
    private auth: AngularFireAuth,
    private clipService: ClipService,
    private router: Router
  ) {
    auth.user.subscribe(user => this.user = user)
  }

  ngOnDestroy(): void {
    this.task?.cancel()
  }

  storeFile($event: Event) {
    this.isDragover = false

    if (($event as DragEvent).dataTransfer) {
      this.file = ($event as DragEvent).dataTransfer?.files.item(0) ?? null
    } else {
      this.file = ($event.target as HTMLInputElement).files?.item(0) ?? null
    }

    if (!this.file || this.file.type !== 'video/mp4') {
      return
    }

    this.title.setValue(this.file.name.replace(/\.[^/.]+$/, ''))
    this.nextStep = true
  }

  uploadFile() {
    this.uploadForm.disable()

    this.showAlert = true
    this.alertMessage = 'Please wait! Your clip is being uploaded.'
    this.alertColor = 'sky'
    this.inSubmission = true
    this.showPercentage = true

    const clipName = uuid()
    const clipPath = `clips/${clipName}.mp4`

    this.task = this.storage.upload(clipPath, this.file)
    const clipRef = this.storage.ref(clipPath)

    this.task.percentageChanges().subscribe(progress => {
      this.percentage = progress as number / 100
    })

    this.task.snapshotChanges().pipe(last(), switchMap(() => clipRef.getDownloadURL())).subscribe({
      next: async (url) => {
        const clip = {
          uid: this.user?.uid as string,
          displayName: this.user?.displayName as string,
          title: this.title.value,
          fileName: `${clipName}.mp4`,
          url,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }

        const clipDocRef = await this.clipService.createClip(clip)

        this.alertColor = 'green'
        this.alertMessage = 'Success! Your clip is ready to share with the world.'
        this.showPercentage = false

        setTimeout(() => {
          this.router.navigate([
            'clip', clipDocRef.id
          ])
        }, 1000)
      },
      error: (error) => {
        this.uploadForm.enable()
        this.alertColor = 'red'
        this.alertMessage = 'Upload failed! Please try again later.'
        this.showPercentage = false
        this.inSubmission = true
        console.error(error)
      }
    })
  }

}