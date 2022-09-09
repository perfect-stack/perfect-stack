import {Component, Input, OnInit} from '@angular/core';
import {MetaAttribute} from '../../../../../domain/meta.entity';
import {Cell, LabelLayoutType} from '../../../../../domain/meta.page';
import {DataService} from '../../../../data-service/data.service';
import {UntypedFormGroup} from '@angular/forms';
import {CellAttribute} from '../../../../../meta/page/meta-page-service/meta-page.service';

@Component({
  selector: 'lib-select-two-control',
  templateUrl: './select-two-control.component.html',
  styleUrls: ['./select-two-control.component.css']
})
export class SelectTwoControlComponent implements OnInit {

  // Important: This is needed because we are just a wrapper for the real components and so this component sets the
  // formControlName for those components and not the Cell/template above us.
  @Input()
  formGroup: UntypedFormGroup;

  @Input()
  attribute: MetaAttribute;

  @Input()
  mode: string | null;

  @Input()
  cell: Cell;

  secondaryAttributeName: string;
  secondaryOptions: string[] = [];

  combinedValue: string | null = null;

  constructor(protected readonly dataService: DataService) { }

  ngOnInit(): void {
    this.secondaryAttributeName = (this.cell.componentData as any).secondaryAttributeName;

    const id = this.formGroup.get(this.attribute.name + '_id')?.value;
    if(id) {
      this.dataService.findById(this.attribute.relationshipTarget, id).subscribe((response: any) => {
        this.combinedValue = response.name;
        const secondaryAttributeControl = this.formGroup.get(this.secondaryAttributeName);
        if(secondaryAttributeControl && secondaryAttributeControl.value) {
          this.combinedValue += ' - ' + secondaryAttributeControl.value;
        }
      });
    }
    else {
      this.combinedValue = '—'
    }
  }

  isReadOnly() {
    return this.mode === 'view';
  }

  getCSSClass(css: string) {
    return this.isReadOnly() ? `form-control ${css}` : `form-select ${css}`;
  }

  onSelectedEntity(entity: any) {
    //console.log(`onSelectedEntity() touched = ${this.formGroup.touched}`);
    console.log(`onSelectedEntity() entity: `, entity);

    if(entity && this.secondaryAttributeName) {
      const secondaryValues: string = entity[this.secondaryAttributeName];
      if(secondaryValues) {
        this.secondaryOptions = secondaryValues.split(',').map(value => value.trim());
      }
      else {
        this.secondaryOptions = [];
      }

      // // This bit is important and was the cause of a bug. Only enable the form control if we are not isReadOnly()
      // if(!this.isReadOnly()) {
      //   this.formGroup.controls[this.secondaryAttributeName].enable({
      //     onlySelf: true
      //   });
      // }
    }
    else {
      this.secondaryOptions = [];
      // this.formGroup.controls[this.secondaryAttributeName].disable({
      //   onlySelf: true
      // });
    }
    //console.log(`onSelectedEntity() touched = ${this.formGroup.touched}`);
  }

  isShowLabelTop(cell: CellAttribute): boolean {
    // We default to "Top" if not supplied
    return !cell.labelLayout || cell.labelLayout === LabelLayoutType.Top;
  }

  isShowLabelLeft(cell: CellAttribute): boolean {
    return cell.labelLayout === LabelLayoutType.Left;
  }
}
