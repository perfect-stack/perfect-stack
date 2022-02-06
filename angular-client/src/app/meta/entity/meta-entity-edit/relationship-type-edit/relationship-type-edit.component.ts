import {Component, Input, OnInit} from '@angular/core';
import {Observable} from 'rxjs';
import {AttributeType, MetaEntity} from '../../../../domain/meta.entity';
import {MetaEntityService} from '../../meta-entity-service/meta-entity.service';
import {FormGroup} from '@angular/forms';

@Component({
  selector: 'app-relationship-type-edit',
  templateUrl: './relationship-type-edit.component.html',
  styleUrls: ['./relationship-type-edit.component.css']
})
export class RelationshipTypeEditComponent implements OnInit {

  @Input()
  formGroup: FormGroup;

  metaEntityOptions$: Observable<MetaEntity[]>
  targetMetaEntity: MetaEntity;

  constructor(protected readonly metaEntityService: MetaEntityService) { }

  ngOnInit(): void {
    this.metaEntityOptions$ = this.metaEntityService.findAll();

    const relationshipTarget = this.formGroup?.controls['relationshipTarget']?.value;
    this.metaEntityService.findById(relationshipTarget).subscribe(metaEntity => this.targetMetaEntity = metaEntity);

    this.formGroup.valueChanges.subscribe((changes) => {
      const relationshipTarget = this.formGroup?.controls['relationshipTarget']?.value;
      this.metaEntityService.findById(relationshipTarget).subscribe(metaEntity => this.targetMetaEntity = metaEntity);
    })
  }

  isManyToOne() {
    const type = this.formGroup.controls['type'].value;
    return type === AttributeType.ManyToOne;
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
    return this?.targetMetaEntity.attributes.find(a => a.name === attributeName)?.label;
  }

  removeSearchTerm(idx: number) {
    let value = this.typeaheadSearchControl?.value as [];
    if(value) {
      value.splice(idx, 1);
    }
  }
}
