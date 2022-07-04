import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControlStatus, FormGroup} from '@angular/forms';
import {MetaAttribute} from '../../../../../domain/meta.entity';
import {DataService} from '../../../../data-service/data.service';
import {Observable, of, Subscription, switchMap} from 'rxjs';
import {Entity} from '../../../../../domain/entity';

@Component({
  selector: 'app-select-control',
  templateUrl: './select-control.component.html',
  styleUrls: ['./select-control.component.css']
})
export class SelectControlComponent implements OnInit, OnDestroy {

  @Input()
  formGroup: FormGroup;

  @Input()
  attribute: MetaAttribute;

  @Input()
  mode: string | null;

  selectedEntity: any;
  options$: Observable<Entity[]>

  status: FormControlStatus = 'PENDING';
  statusSubscription: Subscription;

  constructor(protected readonly dataService: DataService) { }

  ngOnInit(): void {
    if(this.formGroup && this.attribute) {
      this.selectedEntity = this.formGroup.controls[this.attribute.name].value;
    }

    this.statusSubscription = this.formGroup.controls[this.attribute.name].statusChanges.subscribe((formControlStatus) => {
      this.status = formControlStatus;
    });

    this.options$ = this.dataService.findAll(this.attribute.relationshipTarget).pipe(
      switchMap(response => {
        return of(response.resultList as Entity[]);
      }
    ));
  }

  isReadOnly() {
    return this.mode === 'view';
  }

  getDisplayText(option: any) {
    let displayValue = '';
    for(const displayAttributeName of this.attribute.typeaheadSearch) {
      displayValue += option[displayAttributeName];
      displayValue += ' ';
    }
    return displayValue;
  }

  byEntityId(entity1: Entity, entity2: Entity) {
    if(entity1 && entity2) {
      return entity1.id === entity2.id;
    }
    else {
      return entity1 === null && entity2 === null;
    }
  }

  onModelChange(selectedEntity: any) {
    console.log('onModelChange()', selectedEntity);
    if(this.formGroup && this.attribute) {
      const controlName = (this.attribute.name + '_id').toLowerCase();
      if(selectedEntity) {
        this.formGroup.controls[this.attribute.name].patchValue(selectedEntity);
        this.formGroup.controls[controlName].setValue(selectedEntity.id);
      }
      else {
        this.formGroup.controls[this.attribute.name].reset();
        this.formGroup.controls[controlName].reset();
      }
    }
  }

  ngOnDestroy(): void {
    if(this.statusSubscription) {
      this.statusSubscription.unsubscribe();
    }
  }
}
