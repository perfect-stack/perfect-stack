import {Component, OnInit} from '@angular/core';
import {UntypedFormArray, UntypedFormControl, UntypedFormGroup, Validators} from '@angular/forms';
import {AttributeType, ComparisonOperator, MetaAttribute, VisibilityType} from '../domain/meta.entity';
import {CellAttribute} from '../meta/page/meta-page-service/meta-page.service';

@Component({
    selector: 'lib-select-test-page',
    templateUrl: './select-test-page.component.html',
    styleUrls: ['./select-test-page.component.css'],
    standalone: false
})
export class SelectTestPageComponent implements OnInit {

  formGroup: UntypedFormGroup = new UntypedFormGroup({
    observers: new UntypedFormArray([]),
  });

  attribute: MetaAttribute = {
    name: 'observer_role',
    label: 'Observer role',
    description: '',
    type: AttributeType.ManyToOne,
    visibility: VisibilityType.Required,
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
    rules: [],
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

  mode = 'edit';

  constructor() { }

  ngOnInit(): void {
    this.cell.attribute = this.attribute;
    this.onAdd('2a9a9151-2452-4b53-8448-f53c48736421');
  }

  get attributes(): UntypedFormArray | null {
    return this.formGroup.controls['observers'] as UntypedFormArray;
  }

  getFormGroupForRow(rowIdx: number): UntypedFormGroup | null {
    return this.attributes ? this.attributes.at(rowIdx) as UntypedFormGroup : null;
  }

  onAdd(id?: string) {
    console.log('onAdd()');
    const row = new UntypedFormGroup({
      observer_role_id: new UntypedFormControl('')
      //observer_role_id: new FormControl('', Validators.required)
    });

    if(id) {
      // either way should work
      // row.patchValue({
      //   observer_role_id: id
      // });

      row.controls['observer_role_id'].setValue(id);
    }

    this.attributes!.push(row);
    console.log('onAdd() - finished.', this.attributes?.controls);
  }

  onMode() {
    if(this.mode === 'edit') {
      this.mode = 'view';
    }
    else {
      this.mode = 'edit';
    }
  }
}
