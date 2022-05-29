import {Component, OnDestroy, OnInit} from '@angular/core';
import {PropertyEditEvent, PropertySheetService} from './property-sheet.service';
import {Subscription} from 'rxjs';

@Component({
  selector: 'lib-property-sheet',
  templateUrl: './property-sheet.component.html',
  styleUrls: ['./property-sheet.component.css']
})
export class PropertySheetComponent implements OnInit, OnDestroy {

  editEvent : PropertyEditEvent;

  editEventSubscription: Subscription;

  constructor(protected propertySheetService: PropertySheetService) {
    this.editEventSubscription = this.propertySheetService.editEvent$.subscribe((editEvent: PropertyEditEvent) => {
      this.editEvent = editEvent;
    });
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    if(this.editEventSubscription) {
      this.editEventSubscription.unsubscribe();
    }
  }
}
