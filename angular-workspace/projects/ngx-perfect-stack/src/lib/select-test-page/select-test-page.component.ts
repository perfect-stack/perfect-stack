import {Component, OnInit} from '@angular/core';
import {FormArray, FormControl, FormGroup} from '@angular/forms';
import {
  AttributeType,
  ComparisonOperator,
  DiscriminatorAttribute,
  MetaAttribute,
  VisibilityType
} from '../domain/meta.entity';
import {Cell} from '../domain/meta.page';
import {CellAttribute} from '../meta/page/meta-page-service/meta-page.service';

@Component({
  selector: 'lib-select-test-page',
  templateUrl: './select-test-page.component.html',
  styleUrls: ['./select-test-page.component.css']
})
export class SelectTestPageComponent implements OnInit {

  formGroup: FormGroup = new FormGroup({
    observers: new FormArray([]),
  });

  attribute: MetaAttribute = {
    name: 'observer_role',
    label: 'Observer role',
    description: '',
    type: AttributeType.ManyToOne,
    visibility: VisibilityType.Visible,
    comparisonField: '',
    comparisonOperator: ComparisonOperator.Equals,
    relationshipTarget: 'ObserverRole',
    typeaheadSearch: [
      'name'
    ],
    discriminator: {
      entityMappingList: [],
      discriminatorName: '',
      discriminatorType: ''
    },
    enumeration: [],
    unitOfMeasure: '',
    scale: '',
  };

  cell: CellAttribute = {
    width: "1",
    height: "1",
    attributeName: "observer_role",
    component: "Select"
  }


  constructor() { }

  ngOnInit(): void {
    this.cell.attribute = this.attribute;
  }

  get attributes(): FormArray | null {
    //return this.formGroup.get('observers') as FormArray;
    return this.formGroup.controls['observers'] as FormArray;
  }

  getFormGroupForRow(rowIdx: number): FormGroup | null {
    return this.attributes ? this.attributes.at(rowIdx) as FormGroup : null;
  }

  onAdd() {
    console.log('onAdd()');
    //const formArray = this.formGroup.controls['observers'] as FormArray;

    const row = new FormGroup({
      observer_role: new FormGroup({})
    })

    //formArray.push(row);
    this.attributes!.push(row);
    console.log('onAdd() - finished.', this.attributes?.controls);
  }
}
