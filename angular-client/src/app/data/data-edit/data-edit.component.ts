import {Component, Injectable, OnInit} from '@angular/core';
import {Observable, switchMap, tap} from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';
import {DataService} from '../data-service/data.service';
import {NgbDateAdapter, NgbDateStruct} from '@ng-bootstrap/ng-bootstrap';
import {FormContext, FormService} from './form-service/form.service';


@Component({
  selector: 'app-data-edit',
  templateUrl: './data-edit.component.html',
  styleUrls: ['./data-edit.component.css']
})
export class DataEditComponent implements OnInit {

  public metaName: string | null;
  public mode: string | null;
  public entityId: string | null;

  ctx$: Observable<FormContext>;

  constructor(protected readonly route: ActivatedRoute,
              protected readonly router: Router,
              protected readonly formService: FormService,
              protected readonly dataService: DataService) {
  }

  ngOnInit(): void {
    this.ctx$ = this.route.paramMap.pipe(switchMap(params => {
      this.metaName = params.get('metaName');
      this.mode = params.get('mode');
      this.entityId = params.get('id');

      if(this.metaName && this.mode && this.entityId) {
        return this.formService.loadFormContext(this.metaName, this.mode, this.entityId);
      }
      else {
        throw new Error('Invalid input parameters; ');
      }
    }));
  }

  onBack() {
    this.router.navigate([`/data/${this.metaName}/search`]);
  }

  onEdit() {
    this.router.navigate([`/data/${this.metaName}/edit`, this.entityId]);
  }

  onCancel() {
    this.router.navigate([`/data/${this.metaName}/view`, this.entityId]);
  }

  onSave(ctx: FormContext) {
    const entityData = ctx.entityForm.value;

    // TODO: we are going to need to think about hidden attributes not bound to the form, otherwise they are not
    // going to survive the round trip from the database.
    entityData.id = this.entityId;

    this.dataService.update(this.metaName, entityData).subscribe(() => {
      this.onCancel();
    });
  }

}


/**
 * This Service handles how the date is represented in scripts i.e. ngModel.
 */
@Injectable()
export class CustomAdapter extends NgbDateAdapter<string> {

  readonly DELIMITER = '-';

  fromModel(value: string | null): NgbDateStruct | null {
    if (value) {
      let date = value.split(this.DELIMITER);
      return {
        year : parseInt(date[0], 10),
        month : parseInt(date[1], 10),
        day : parseInt(date[2], 10),
      };
    }
    return null;
  }

  toModel(date: NgbDateStruct | null): string | null {
    return date ? date.year + this.DELIMITER + date.month + this.DELIMITER + date.day : null;
  }
}
