import {Component, Input, OnInit} from '@angular/core';
import {MetaAttribute} from '../../../../../domain/meta.entity';
import {Cell} from '../../../../../domain/meta.page';
import {DataService} from '../../../../data-service/data.service';
import {FormGroup} from '@angular/forms';

@Component({
  selector: 'lib-select-two-control',
  templateUrl: './select-two-control.component.html',
  styleUrls: ['./select-two-control.component.css']
})
export class SelectTwoControlComponent implements OnInit {

  // Important: Only use the FormGroup to talk to the secondary attribute control
  @Input()
  formGroup: FormGroup;

  @Input()
  attribute: MetaAttribute;

  @Input()
  mode: string | null;

  @Input()
  cell: Cell;

  secondaryAttributeName: string;
  secondaryOptions: string[] = [];

  constructor(protected readonly dataService: DataService) { }

  ngOnInit(): void {
    this.secondaryAttributeName = (this.cell.componentData as any).secondaryAttributeName;

    // if(this.secondaryAttributeName) {
    //   const secondaryAttributeControl = this.formGroup.controls[this.secondaryAttributeName];
    //   if(secondaryAttributeControl && this.isReadOnly()) {
    //     console.log('GOT secondaryAttributeControl && isReadOnly() ')
    //     secondaryAttributeControl.disable({onlySelf: false, emitEvent: true});
    //   }
    // }

  }

  isReadOnly() {
    return this.mode === 'view';
  }

  getCSSClass(css: string) {
    return this.isReadOnly() ? `form-control ${css}` : `form-select ${css}`;
  }

  onSelectedEntity(entity: any) {
    console.log('onSelectedEntity()', entity);

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
  }
}
