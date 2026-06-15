import { Component } from '@angular/core';
import {StationSensorActivityListenerService} from "./pages/station-sensor-activity-listener.service";
import {EventService} from "@perfect-stack/ngx-perfect-stack";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false
})
export class AppComponent {
  title = 'capture-client';

  constructor(
    private eventService: EventService,
    private stationSensorActivityListenerService: StationSensorActivityListenerService)
  {
    this.eventService.addActionListener(this.stationSensorActivityListenerService, 'StationSensorActivity.view_edit', 'SaveChannel');
  }
}
