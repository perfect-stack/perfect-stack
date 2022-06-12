import {Component, Input, OnInit} from '@angular/core';
import {FormGroup} from '@angular/forms';

@Component({
  selector: 'lib-time-control',
  templateUrl: './time-control.component.html',
  styleUrls: ['./time-control.component.css']
})
export class TimeControlComponent implements OnInit {

  @Input()
  mode: string | null;

  @Input()
  formGroup: FormGroup;

  @Input()
  name: string;

  constructor() { }

  ngOnInit(): void {
  }

  onTimeChanged(value: any) {
    //const value = $event.target.value;
    console.log(`onTimeChanged: ${value}`);
  }

  onCancel($event: any) {
    console.log('onCancel()');
  }

  onClosed() {
    console.log('onClosed');
  }
}
