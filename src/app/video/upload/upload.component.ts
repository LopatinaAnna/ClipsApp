import { Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AngularFireStorage, AngularFireUploadTask } from '@angular/fire/compat/storage';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app'
import { v4 as uuid } from 'uuid'
import { switchMap, combineLatest, forkJoin } from 'rxjs';
import { ClipService } from 'src/app/services/clip.service';
import { Router } from '@angular/router';
import { FfmpegService } from 'src/app/services/ffmpeg.service';

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

  clipTask?: AngularFireUploadTask

  screenshots: string[] = []
  selectedScreenshot = ''
  screenshotTask?: AngularFireUploadTask

  title = new FormControl('', [Validators.required, Validators.minLength(1)])
  uploadForm = new FormGroup({
    title: this.title
  })

  constructor(
    private storage: AngularFireStorage,
    private auth: AngularFireAuth,
    private clipService: ClipService,
    private router: Router,
    public ffmpegService: FfmpegService
  ) {
    auth.user.subscribe(user => this.user = user)
    ffmpegService.init()
  }

  ngOnDestroy(): void {
    this.clipTask?.cancel()
  }

  async storeFile($event: Event) {
    if (this.ffmpegService.isRunning) {
      return
    }

    this.isDragover = false

    if (($event as DragEvent).dataTransfer) {
      this.file = ($event as DragEvent).dataTransfer?.files.item(0) ?? null
    } else {
      this.file = ($event.target as HTMLInputElement).files?.item(0) ?? null
    }

    if (!this.file || this.file.type !== 'video/mp4') {
      return
    }

    this.screenshots = await this.ffmpegService.getScreenshots(this.file)

    this.selectedScreenshot = this.screenshots[0]

    this.title.setValue(this.file.name.replace(/\.[^/.]+$/, ''))
    this.nextStep = true
  }

  async uploadFile() {
    this.uploadForm.disable()

    this.showAlert = true
    this.alertMessage = 'Please wait! Your clip is being uploaded.'
    this.alertColor = 'sky'
    this.inSubmission = true
    this.showPercentage = true

    const clipName = uuid()
    const clipPath = `clips/${clipName}.mp4`

    const screenshotBlob = await this.ffmpegService.blobFromURL(
      this.selectedScreenshot
    )

    const screenshotPath = `screenshots/${clipName}.png`

    this.clipTask = this.storage.upload(clipPath, this.file)
    const clipRef = this.storage.ref(clipPath)

    this.screenshotTask = this.storage.upload(screenshotPath, screenshotBlob)
    const screenshotRef = this.storage.ref(screenshotPath)

    combineLatest([
      this.clipTask.percentageChanges(),
      this.screenshotTask.percentageChanges()
    ]).subscribe(progress => {
      const [clipProgress, screenshotProgress] = progress

      if (!clipProgress || !screenshotProgress) {
        return
      }

      this.percentage = (clipProgress + screenshotProgress) as number / 200
    })

    forkJoin([
      this.clipTask.snapshotChanges(),
      this.screenshotTask.snapshotChanges()
    ]).pipe(
      switchMap(() => forkJoin([
        clipRef.getDownloadURL(),
        screenshotRef.getDownloadURL()
      ]))
    ).subscribe({
      next: async (urls) => {
        const [clipURL, screenshotURL] = urls

        const clip = {
          uid: this.user?.uid as string,
          displayName: this.user?.displayName as string,
          title: this.title.value,
          fileName: `${clipName}.mp4`,
          url: clipURL,
          screenshotURL,
          screenshotName: `${clipName}.png`,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }

        const clipDocRef = await this.clipService.createClip(clip)

        console.log(clip)

        this.alertColor = 'green'
        this.alertMessage = 'Success! Your clip is now ready to share with the world.'
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
        this.inSubmission = true
        this.showPercentage = false
        console.error(error)
      }
    })
  }

}
