import { Component } from '@angular/core';
import {EventService} from '../../../ngx-perfect-stack/src/lib/event/event.service';
import {EventPageListenerService} from './pages/event-page-listener.service';
import {BirdViewPageListenerService} from './pages/bird-view-page-listener.service';
import {EventSearchPageListenerService} from './pages/event-search-page-listener.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  constructor(protected readonly eventService: EventService,
              protected readonly birdViewPageListenerService: BirdViewPageListenerService,
              protected readonly eventSearchPageListenerService: EventSearchPageListenerService,
              protected readonly eventPageListenerService: EventPageListenerService) {
    this.eventService.addPageListener(this.birdViewPageListenerService, 'Bird.view');
    this.eventService.addPageListener(this.eventSearchPageListenerService, 'Event.search');
    this.eventService.addPageListener(this.eventPageListenerService, 'Event.view_edit');
  }
}
