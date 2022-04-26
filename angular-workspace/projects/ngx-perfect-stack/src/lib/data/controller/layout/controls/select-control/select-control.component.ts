import {Component, Input, OnInit} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {MetaAttribute} from '../../../../../domain/meta.entity';
import {DataService} from '../../../../data-service/data.service';
import {Observable, of, switchMap} from 'rxjs';
import {Entity} from '../../../../../domain/entity';

@Component({
  selector: 'app-select-control',
  templateUrl: './select-control.component.html',
  styleUrls: ['./select-control.component.css']
})
export class SelectControlComponent implements OnInit {

  @Input()
  formGroup: FormGroup;

  @Input()
  attribute: MetaAttribute;

  @Input()
  mode: string | null;

  options$: Observable<Entity[]>

  constructor(protected readonly dataService: DataService) { }

  ngOnInit(): void {
    this.options$ = this.dataService.findAll(this.attribute.relationshipTarget).pipe(
      switchMap(response => {
        return of(response.resultList as Entity[]);
      }
    ));
  }

  isReadOnly() {
    return this.mode === 'view';
  }

  getCSSClass() {
    return this.isReadOnly() ? 'form-control': 'form-select';
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

}
