import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DragService {

  dragInProgress$ = new BehaviorSubject<string>('stopped');
  dragData: any;

  get isDragging(): boolean {
    return this.dragInProgress$.value === 'started';
  }

  constructor() {
    (this.dragInProgress$ as any).emit = (val: string) => this.dragInProgress$.next(val);
  }

  startDrag(data?: any) {
    this.dragData = data;
    this.dragInProgress$.next('started');
  }

  stopDrag() {
    this.dragData = undefined;
    this.dragInProgress$.next('stopped');
  }

}
