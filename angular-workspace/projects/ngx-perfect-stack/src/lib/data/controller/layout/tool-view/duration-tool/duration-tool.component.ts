import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, UntypedFormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Duration, Instant } from '@js-joda/core';
import { DurationTool } from '../../../../../domain/meta.page';
import { FormContext } from '../../../../data-edit/form-service/form.service';

@Component({
  selector: 'lib-duration-tool',
  templateUrl: './duration-tool.component.html',
  styleUrls: ['./duration-tool.component.css'],
  standalone: false
})
export class DurationToolComponent implements OnInit, OnDestroy {

  @Input()
  durationTool: DurationTool;

  @Input()
  ctx: FormContext;

  @Input()
  editorMode = false;

  startDateTimeControl: AbstractControl;
  endDateTimeControl: AbstractControl;

  startDateTimeSubscription: Subscription;
  endDateTimeSubscription: Subscription;

  durationLabel: string = '-';

  constructor() {
  }

  ngOnInit(): void {
    const formGroup = this.ctx.formMap.values().next().value as UntypedFormGroup;
    this.startDateTimeControl = formGroup.controls['date_time'];
    this.endDateTimeControl = formGroup.controls['end_date_time'];

    this.startDateTimeSubscription = this.startDateTimeControl.valueChanges.subscribe(() => {
      this.updateDuration();
    });

    this.endDateTimeSubscription = this.endDateTimeControl.valueChanges.subscribe(() => {
      this.updateDuration();
    });

    // pump once to get started
    this.updateDuration();
  }

  updateDuration() {
    try {
      const startDateTime = Instant.parse(this.startDateTimeControl.value);
      const endDateTime = Instant.parse(this.endDateTimeControl.value);
      const duration = Duration.between(startDateTime, endDateTime);

      const days = duration.toDays();
      const hours = duration.toHours() - (days * 24);
      const mins = duration.toMinutes() - (days * 24 * 60) - (hours * 60);

      if(days > 0) {
        this.durationLabel = `${days} days ${hours} hours ${mins} mins`;
      }
      else if(hours > 0) {
        this.durationLabel = `${hours} hours ${mins} mins`;
      }
      else {
        this.durationLabel = `${mins} mins`;
      }
    }
    catch (e) {
      // ok to swallow and keep going
    }
  }

  ngOnDestroy(): void {
    if(this.startDateTimeSubscription) {
      this.startDateTimeSubscription.unsubscribe();
    }

    if(this.endDateTimeSubscription) {
      this.endDateTimeSubscription.unsubscribe();
    }
  }
}
