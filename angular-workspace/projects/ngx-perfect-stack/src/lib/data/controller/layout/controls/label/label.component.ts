import {Component, Input, OnInit} from '@angular/core';
import {MetaAttribute, MetaEntity} from '../../../../../domain/meta.entity';
import {Cell, LabelLayoutType} from '../../../../../domain/meta.page';
import {CellAttribute} from '../../../../../meta/page/meta-page-service/meta-page.service';

@Component({
    selector: 'lib-label',
    templateUrl: './label.component.html',
    styleUrls: ['./label.component.css'],
    standalone: false
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

  @Input()
  idSuffix?: string | null;

  labelHidden = false;
  secondaryAttribute: MetaAttribute | undefined;

  constructor() { }

  ngOnInit(): void {
    if(this.cell) {
      if(this.cell.component === 'Spy') {
        this.labelHidden = true;
      }

      if(this.cell.component === 'SelectTwo') {
        const secondaryAttributeName = ((this.cell.componentData as unknown) as any)?.secondaryAttributeName;
        if(secondaryAttributeName) {
          this.secondaryAttribute = this.metaEntity.attributes.find(a => a.name === secondaryAttributeName);
        }
      }
    }
  }

  get labelForId(): string {
    return this.attribute?.name ? (this.idSuffix ? `${this.attribute.name}-${this.idSuffix}` : this.attribute.name) : '';
  }

  get secondaryLabelForId(): string {
    return this.secondaryAttribute?.name ? (this.idSuffix ? `${this.secondaryAttribute.name}-${this.idSuffix}` : this.secondaryAttribute.name) : '';
  }

  isShowLabelTop(cell: CellAttribute): boolean {
    // We default to "Top" if not supplied
    return !cell.labelLayout || cell.labelLayout === LabelLayoutType.Top;
  }

  isShowLabelLeft(cell: CellAttribute): boolean {
    return cell.labelLayout === LabelLayoutType.Left;
  }

}
