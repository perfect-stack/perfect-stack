import {Directive, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {DragService} from './drag.service';

@Directive({
    selector: '[my-dropzone]',
    standalone: false
})
export class DropzoneDirective implements OnInit, OnDestroy {

  @Output()
  myDropZoneDroppedEvent = new EventEmitter();

  private _dropDisabled = false;

  dragInProgressSubscription = this.dragService.dragInProgress$.subscribe((value: string) => {
    const el = this._elementRef.nativeElement;
    if(value === 'started') {
      if(!this._dropDisabled) {
        el.classList.add('drag-hint-border');
      }
    }
    else if(value === 'stopped') {
      el.classList.remove('drag-hint-border');
      el.classList.remove('over');
    }
  });

  private dragenter = (e: any) => {
    this._elementRef.nativeElement.classList.add('over');
  };

  private dragleave = (e: any) => {
    this._elementRef.nativeElement.classList.remove('over');
  };

  private dragover = (e: any) => {
    if (e.preventDefault) {
      e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
  };

  private drop = (e: any) => {
    if (e.stopPropagation) {
      e.stopPropagation(); // Stops some browsers from redirecting.
    }
    this._elementRef.nativeElement.classList.remove('over');
    let data = JSON.parse(e.dataTransfer.getData('text/plain'));
    this.myDropZoneDroppedEvent.emit(data);
    return false;
  };

  constructor(private _elementRef: ElementRef, protected readonly dragService: DragService) {
  }

  ngOnInit(): void {
    this.addListeners();
    if(this.dragService.isDragging && !this._dropDisabled) {
      this._elementRef.nativeElement.classList.add('drag-hint-border');
    }
  }

  get dropDisabled(): boolean {
    return this._dropDisabled;
  }

  @Input()
  set dropDisabled(value: boolean) {
    const added = this._dropDisabled && !value;
    const removed = !this._dropDisabled && value;
    this._dropDisabled = value;
    if(added) {
      this.addListeners();
      if(this.dragService.isDragging) {
        this._elementRef.nativeElement.classList.add('drag-hint-border');
      }
    }

    if(removed) {
      this.removeListeners();
      this._elementRef.nativeElement.classList.remove('drag-hint-border');
      this._elementRef.nativeElement.classList.remove('over');
    }
  }

  private addListeners() {
    let el = this._elementRef.nativeElement;
    el.addEventListener('dragenter', this.dragenter);
    el.addEventListener('dragleave', this.dragleave);
    el.addEventListener('dragover', this.dragover);
    el.addEventListener('drop', this.drop);
  }

  private removeListeners() {
    let el = this._elementRef.nativeElement;
    el.removeEventListener('dragenter', this.dragenter);
    el.removeEventListener('dragleave', this.dragleave);
    el.removeEventListener('dragover', this.dragover);
    el.removeEventListener('drop', this.drop);
  }

  ngOnDestroy(): void {
    this.dragInProgressSubscription.unsubscribe();
    this.removeListeners();
  }

}
