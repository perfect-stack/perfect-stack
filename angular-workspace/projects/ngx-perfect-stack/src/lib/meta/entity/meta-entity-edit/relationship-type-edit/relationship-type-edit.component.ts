import {Component, Input, OnInit} from '@angular/core';
import {AttributeType, MetaEntity} from '../../../../domain/meta.entity';
import {MetaEntityService} from '../../meta-entity-service/meta-entity.service';
import {UntypedFormGroup} from '@angular/forms';

@Component({
    selector: 'app-relationship-type-edit',
    templateUrl: './relationship-type-edit.component.html',
    styleUrls: ['./relationship-type-edit.component.css'],
    standalone: false
})
export class RelationshipTypeEditComponent implements OnInit {

  @Input()
  formGroup: UntypedFormGroup;

  @Input()
  metaEntityOptions: MetaEntity[];

  targetMetaEntity: MetaEntity;

  constructor(protected readonly metaEntityService: MetaEntityService) { }

  ngOnInit(): void {
    //this.metaEntityOptions$ = this.metaEntityService.findAll();

    const relationshipTarget = this.formGroup?.controls['relationshipTarget']?.value;
    if(relationshipTarget) {
      this.metaEntityService.findById(relationshipTarget).subscribe(metaEntity => this.targetMetaEntity = metaEntity);
    }

    this.formGroup.valueChanges.subscribe((changes) => {
      const relationshipTarget = this.formGroup?.controls['relationshipTarget']?.value;
      this.metaEntityService.findById(relationshipTarget).subscribe(metaEntity => this.targetMetaEntity = metaEntity);
    })
  }

  isManyToOne() {
    const manyToOneTypes = [AttributeType.ManyToOne, AttributeType.SelectMultiple];
    return manyToOneTypes.includes(this.formGroup.controls['type'].value);
  }

  get typeaheadSearchControl() {
    const typeaheadSearchControl = this?.formGroup?.controls['typeaheadSearch'];
    if(typeaheadSearchControl) {
      if(!typeaheadSearchControl.value) {
        typeaheadSearchControl.setValue([]);
      }
    }
    return typeaheadSearchControl;
  }

  onTypeaheadSearchChange($event: any) {
    if(this.typeaheadSearchControl && $event.target.value) {
      this.typeaheadSearchControl.value.push($event.target.value);
    }
  }

  toAttributeLabel(attributeName: string) {
    if(this.targetMetaEntity) {
      const attribute = this.targetMetaEntity.attributes.find(a => a.name === attributeName);
      if(attribute && attribute.label) {
        return attribute.label;
      }
      else {
        return '';
      }
    }
    else {
      return '';
    }
  }

  removeSearchTerm(idx: number) {
    let value = this.typeaheadSearchControl?.value as [];
    if(value) {
      value.splice(idx, 1);
    }
  }
}
