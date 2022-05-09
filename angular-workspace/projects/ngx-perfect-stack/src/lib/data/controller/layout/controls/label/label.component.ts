import {Component, Input, OnInit} from '@angular/core';
import {MetaAttribute, MetaEntity} from '../../../../../domain/meta.entity';
import {Cell} from '../../../../../domain/meta.page';

@Component({
  selector: 'lib-label',
  templateUrl: './label.component.html',
  styleUrls: ['./label.component.css']
})
export class LabelComponent implements OnInit {

  @Input()
  mode: string | null;

  @Input()
  metaEntity: MetaEntity;

  @Input()
  attribute: MetaAttribute;

  @Input()
  cell: Cell;

  secondaryAttribute: MetaAttribute | undefined;

  constructor() { }

  ngOnInit(): void {
    if(this.cell && this.cell.component === 'SelectTwo') {
      const secondaryAttributeName = ((this.cell.componentData as unknown) as any)?.secondaryAttributeName;
      if(secondaryAttributeName) {
        this.secondaryAttribute = this.metaEntity.attributes.find(a => a.name === secondaryAttributeName);
      }
    }
  }

}
