import {Component, OnInit} from '@angular/core';
import {Observable, switchMap} from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';
import {DataService} from '../data-service/data.service';
import {FormContext, FormService} from './form-service/form.service';
import * as uuid from 'uuid';


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
      this.entityId = this.toUuid(params.get('id'));

      if(this.metaName && this.mode) {
        return this.formService.loadFormContext(this.metaName, this.mode, this.entityId);
      }
      else {
        throw new Error('Invalid input parameters; ');
      }
    }));
  }

  toUuid(value: string | null) {
    if(value === null || value === '**NEW**') {
      return null;
    }
    else {
      // will throw error if invalid, caller should bail out of use case
      uuid.parse(value);
      return value;
    }
  }

  onBack() {
    this.router.navigate([`/data/${this.metaName}/search`]);
  }

  onEdit() {
    this.router.navigate([`/data/${this.metaName}/edit`, this.entityId]);
  }

  onCancel() {
    if(this.entityId) {
      this.router.navigate([`/data/${this.metaName}/view`, this.entityId]);
    }
    else {
      this.router.navigate([`/data/${this.metaName}/search`]);
    }
  }

  onSave(ctx: FormContext) {
    const entityData = ctx.entityForm.value;

    // TODO: we are going to need to think about hidden attributes not bound to the form, otherwise they are not
    // going to survive the round trip from the database.
    entityData.id = this.entityId;

    if(this.metaName) {
      this.dataService.save(this.metaName, entityData).subscribe(() => {
        this.onCancel();
      });
    }
  }

}

