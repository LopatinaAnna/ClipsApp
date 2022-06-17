import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import IClip from 'src/app/models/clip.model';
import { ClipService } from 'src/app/services/clip.service';
import { ModalService } from 'src/app/services/modal.service';

@Component({
  selector: 'app-manage',
  templateUrl: './manage.component.html'
})
export class ManageComponent implements OnInit {
  sortOrder = '1'
  clips: IClip[] = []
  activeClip: IClip | null = null
  sort$: BehaviorSubject<string>

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private clipService: ClipService,
    private modalService: ModalService
  ) {
    this.sort$ = new BehaviorSubject(this.sortOrder)
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.sortOrder = params.get('sort') === '2' ? '2' : '1'
      this.sort$.next(this.sortOrder)
    })
    this.clipService.getUserClips(this.sort$).subscribe(docs => {
      this.clips = []
      docs.forEach(doc => {
        this.clips.push({
          docId: doc.id,
          ...doc.data()
        })
      })
    })
  }

  sort($event: Event) {
    const { value } = $event?.target as HTMLSelectElement
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        sort: value
      }
    })
  }

  openModal($event: Event, clip: IClip) {
    $event.preventDefault()
    this.activeClip = clip
    this.modalService.toggleModal('editClip')
  }

  updateClipList($event: IClip) {
    this.clips.forEach((element, index) => {
      if (element.docId == $event.docId) {
        this.clips[index].title = $event.title
      }
    })
  }

  deleteClip($event: Event, clip: IClip) {
    $event.preventDefault()
    this.clipService.deleteClip(clip)

    this.clips.forEach((element, index) => {

      if (element.docId == clip.docId) {
        this.clips.splice(index, 1)
      }
    })
  }

  async copyToClipboard($event: MouseEvent, docId: string | undefined) {
    $event.preventDefault()

    if (!docId) {
      return
    }

    const url = `${location.origin}/clip/${docId}`
    await navigator.clipboard.writeText(url)
  }
}
