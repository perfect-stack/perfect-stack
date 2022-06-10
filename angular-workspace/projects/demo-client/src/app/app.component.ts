import { Component } from '@angular/core';
import {EventService} from '../../../ngx-perfect-stack/src/lib/event/event.service';
import {EventPageListenerService} from './pages/event-page-listener.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  constructor(protected readonly eventService: EventService,
              protected readonly eventPageListenerService: EventPageListenerService) {
    this.eventService.addPageListener(this.eventPageListenerService, 'Event.view_edit');
  }
}
