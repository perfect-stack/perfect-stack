import {Component, Input, OnInit} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {MetaAttribute} from '../../../../../domain/meta.entity';
import {Observable, of, switchMap} from 'rxjs';
import {Entity} from '../../../../../domain/entity';
import {Cell} from '../../../../../domain/meta.page';
import {DataService} from '../../../../data-service/data.service';

@Component({
  selector: 'lib-select-two-control',
  templateUrl: './select-two-control.component.html',
  styleUrls: ['./select-two-control.component.css']
})
export class SelectTwoControlComponent implements OnInit {

  @Input()
  formGroup: FormGroup;

  @Input()
  attribute: MetaAttribute;

  @Input()
  mode: string | null;

  @Input()
  cell: Cell;


  options$: Observable<Entity[]>

  secondaryAttributeName: string;
  secondaryOptions: string[] = [];


  constructor(protected readonly dataService: DataService) { }

  ngOnInit(): void {
    this.secondaryAttributeName = (this.cell.componentData as any).secondaryAttributeName;

    if(this.secondaryAttributeName) {
      const secondaryAttributeControl = this.formGroup.controls[this.secondaryAttributeName];
      if(secondaryAttributeControl && this.isReadOnly()) {
        console.log('GOT secondaryAttributeControl && isReadOnly() ')
        secondaryAttributeControl.disable({onlySelf: false, emitEvent: true});
      }
    }

    this.options$ = this.dataService.findAll(this.attribute.relationshipTarget).pipe(
      switchMap((response) => {
        return of(response.resultList);
    }));

    const entity = this.formGroup.controls[this.attribute.name].value;
    this.onEntityChange(entity);
  }

  getDisplayValue(entity: any) {
    let displayValue = '';
    for(let i = 0; i < this.attribute.typeaheadSearch.length; i++) {
      const displayAttributeName = this.attribute.typeaheadSearch[i];
      displayValue += entity[displayAttributeName];
      if(i < this.attribute.typeaheadSearch.length - 1) {
        displayValue += ' ';
      }
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

  onEntityChange(primaryEntity: any) {
    console.log(`onEntityChange: `, primaryEntity);
    if(primaryEntity && this.secondaryAttributeName) {
      const secondaryValues: string = primaryEntity[this.secondaryAttributeName];
      if(secondaryValues) {
        this.secondaryOptions = secondaryValues.split(',').map(value => value.trim());
      }
      else {
        this.secondaryOptions = [];
      }

      // This bit is important and was the cause of a bug. Only enable the form control if we are not isReadOnly()
      if(!this.isReadOnly()) {
        this.formGroup.controls[this.secondaryAttributeName].enable({
          onlySelf: true
        });
      }
    }
    else {
      this.secondaryOptions = [];
      this.formGroup.controls[this.secondaryAttributeName].disable({
        onlySelf: true
      });
    }

    console.log(`onEntityChange: secondaryOptions = `, this.secondaryOptions);
  }

  getFormGroupDump() {
    return Object.keys(this.formGroup.controls);
  }

  bySecondaryValue(v1:any, v2:any) {
    console.log('bySecondaryValue:', [v1, v2]);
    return false;
  }

  isReadOnly() {
    return this.mode === 'view';
  }

  getCSSClass(css: string) {
    return this.isReadOnly() ? `form-control ${css}` : `form-select ${css}`;
  }
}
