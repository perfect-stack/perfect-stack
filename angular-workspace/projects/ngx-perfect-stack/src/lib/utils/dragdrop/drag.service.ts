import {EventEmitter, Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DragService {

  dragInProgress$ = new EventEmitter<string>();

  constructor() { }

  startDrag() {
    this.dragInProgress$.emit('started');
  }

  stopDrag() {
    this.dragInProgress$.emit('stopped');
  }

}
