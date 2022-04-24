import { Component, OnInit } from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {MetaAttribute} from '../../../../../domain/meta.entity';
import {FormBuilder} from '@angular/forms';

@Component({
  selector: 'lib-card-item-dialog',
  templateUrl: './card-item-dialog.component.html',
  styleUrls: ['./card-item-dialog.component.css']
})
export class CardItemDialogComponent implements OnInit {
  get metaAttribute(): MetaAttribute {
    return this._metaAttribute;
  }

  set metaAttribute(value: MetaAttribute) {
    this._metaAttribute = value;
    if(this._metaAttribute && this._metaAttribute.discriminator) {
      const discriminator = this._metaAttribute.discriminator;
      if(discriminator.entityMappingList && discriminator.entityMappingList.length > 0) {
        this.itemForm.patchValue({
          itemSelect: discriminator.entityMappingList[0].discriminatorValue
        });
      }
    }
  }

  // Set by calling component via modalRef.instance
  private _metaAttribute: MetaAttribute;

  itemForm =  this.fb.group({
    itemSelect: ['']
  });

  constructor(protected readonly fb: FormBuilder,
              public activeModal: NgbActiveModal) { }

  ngOnInit(): void {
  }

}
