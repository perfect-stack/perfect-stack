import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ComponentType} from '../../../domain/meta.page';
import {MetaAttribute, MetaEntity} from '../../../domain/meta.entity';
import {FormBuilder} from '@angular/forms';

@Component({
  selector: 'lib-cell-settings',
  templateUrl: './cell-settings.component.html',
  styleUrls: ['./cell-settings.component.css']
})
export class CellSettingsComponent implements OnInit {

  // These are expected to be supplied by the caller to this Modal dialog
  metaEntity: MetaEntity;
  attribute: MetaAttribute;

  attributeNames: string[] = [];

  settingsForm = this.fb.group({
    componentType: [''],
    secondaryAttributeName: [''],
    assetUrl: [''],
  });

  constructor(public fb: FormBuilder,
              public activeModal: NgbActiveModal,
              private changeDetection: ChangeDetectorRef) { }

  ngOnInit(): void {
  }

  init(metaEntity: MetaEntity,
       attribute: MetaAttribute,
       component: string | undefined,
       componentData: any | undefined) {
    this.metaEntity = metaEntity;
    this.attribute = attribute;

    if(this.metaEntity) {
      this.attributeNames = this.metaEntity.attributes.map(a => a.name);
    }

    if(component) {
      let secondaryAttributeName = '';
      if(componentData && componentData.secondaryAttributeName) {
        secondaryAttributeName = componentData.secondaryAttributeName;
      }

      console.log(`Init form - componentData:`, componentData);
      console.log(`Init form: ${component}, ${JSON.stringify(secondaryAttributeName)}`);
      this.settingsForm.patchValue({
        componentType: component,
        secondaryAttributeName: secondaryAttributeName,
      });
    }

    this.changeDetection.detectChanges();
  }

  getComponentTypeOptions() {
    return Object.keys(ComponentType);
  }

  onComponentTypeChange(value: any) {
    console.log(`onComponentTypeChange = ${value}`);
  }

  get componentType() {
    return this.settingsForm.get('componentType')?.value;
  }

  get isSelectTwoComponentType() {
    return this.componentType === 'SelectTwo';
  }

  get isStaticImageComponentType() {
    return this.componentType === 'StaticImage';
  }

}

export interface CellSettingsResult {
  componentType: string;
  secondaryAttributeName: string;
}
