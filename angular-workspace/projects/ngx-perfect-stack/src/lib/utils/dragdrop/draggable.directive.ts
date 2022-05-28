import {Directive, ElementRef, Input} from '@angular/core';
import {DragService} from './drag.service';

/**
 * https://medium.com/@mithun_daa/drag-and-drop-in-angular-2-using-native-html5-api-f628ce4edc3b
 */
@Directive({
  selector: '[my-draggable]'
})
export class DraggableDirective {

  @Input('drag-data')
  data: any;

  constructor(private _elementRef: ElementRef,
              protected readonly dragService: DragService) {

    let el = this._elementRef.nativeElement;
    el.draggable = 'true';

    el.addEventListener('dragstart', (e: any) => {
      el.classList.add('drag-border');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', JSON.stringify(this.data));

      this.dragService.startDrag();
    });

    el.addEventListener('dragend', (e: any) => {
      e.preventDefault();
      el.classList.remove('drag-border');

      this.dragService.stopDrag();
    })
  }

}
