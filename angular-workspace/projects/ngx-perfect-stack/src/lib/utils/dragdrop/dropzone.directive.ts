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
      el.classList.add('drag-hint-border')
    }
    else if(value === 'stopped') {
      el.classList.remove('drag-hint-border')
    }
  });

  private dragenter: any;
  private dragleave: any;
  private dragover: any;
  private drop: any;


  constructor(private _elementRef: ElementRef, protected readonly dragService: DragService) {
  }

  ngOnInit(): void {
    // default constructor inits with _dropDisabled = false, so need to addListeners() here directly to match that
    // state. Once this is done then the setter logic will take care of things.
    this.addListeners();
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
    }

    if(removed) {
      this.removeListeners();
    }
  }

  private addListeners() {
    let el = this._elementRef.nativeElement;

    // Add a style to indicate that this element is a drop target
    el.addEventListener('dragenter', (e: any) => {
      el.classList.add('over');
    });

    // Remove the style
    el.addEventListener('dragleave', (e: any) => {
      el.classList.remove('over');
    });

    el.addEventListener('dragover', (e: any) => {
      if (e.preventDefault) {
        e.preventDefault();
      }

      e.dataTransfer.dropEffect = 'move';
      return false;
    });

    // On drop, get the data and convert it back to a JSON object
    // and fire off an event passing the data
    el.addEventListener('drop', (e: any) => {
      if (e.stopPropagation) {
        e.stopPropagation(); // Stops some browsers from redirecting.
      }

      el.classList.remove('over');
      let data = JSON.parse(e.dataTransfer.getData('text/plain'));
      this.myDropZoneDroppedEvent.emit(data);
      return false;
    });
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

