import {Component, Injectable, OnInit} from '@angular/core';
import {Observable, switchMap} from 'rxjs';
import {MetaEntity} from '../../domain/meta.entity';
import {Entity} from '../../domain/entity';
import {ActivatedRoute, Router} from '@angular/router';
import {MetaService} from '../../meta/service/meta.service';
import {DataService} from '../data-service/data.service';
import {AbstractControl, FormControl, FormGroup} from '@angular/forms';
import {NgbDateAdapter, NgbDateStruct} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-data-edit',
  templateUrl: './data-edit.component.html',
  styleUrls: ['./data-edit.component.css']
})
export class DataEditComponent implements OnInit {

  public metaName: string | null;
  public metaEntity$: Observable<MetaEntity>;

  public entityId: string | null;
  public entity$: Observable<Entity>;

  entityForm: FormGroup;

  constructor(protected readonly route: ActivatedRoute,
              protected readonly router: Router,
              protected readonly metaService: MetaService,
              protected readonly dataService: DataService) {
  }

  ngOnInit(): void {

    // TODO: there's probably a race condition here between loading the metaEntity and loading the entity value itself.
    // If the entity is loaded before the metaEntity then this.entityForm.patchValue(entity); will fail
    this.metaEntity$ = this.route.paramMap.pipe(switchMap(params => {
      this.metaName = params.get('metaName')
      return this.metaService.findOne(this.metaName);
    }));

    this.entity$ = this.route.paramMap.pipe(switchMap(params => {
      const metaName = params.get('metaName')
      this.entityId = params.get('id');
      return this.dataService.findById(metaName, this.entityId)
    }));

    this.entity$.subscribe((entity) => {
      if(this.entityForm) {
        this.entityForm.patchValue(entity);
      }
      else {
        console.error('Unable to set entity value since entityForm is not yet created. Need to sort out dependencies better');
      }
    });

    this.metaEntity$.subscribe((metaEntity) => {
      const controls: {
        [key: string]: AbstractControl;
      } = {};

      for(const nextAttribute of metaEntity.attributes) {
        controls[nextAttribute.name] = new FormControl('');
      }

      this.entityForm = new FormGroup(controls);
    });
  }

  onSubmit() {
    const entityData = this.entityForm.value;
    console.log(`onSubmit: ${JSON.stringify(entityData)}`);
    this.dataService.update(this.metaName, entityData).subscribe(() => {
      console.log(`entity save completed`);
      this.onCancel();
    });
  }

  onCancel() {
    this.router.navigate([`/data/${this.metaName}/view`, this.entityId]);
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
