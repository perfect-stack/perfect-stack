import {Component, Input, OnInit, SimpleChanges} from '@angular/core';
import {Cell, ComponentType, MetaPage, Template, TemplateType} from '../../../domain/meta.page';
import {FormArray, FormBuilder, FormGroup} from '@angular/forms';
import {Observable, of, switchMap} from 'rxjs';
import {CellAttribute, MetaPageService} from '../../../meta/page/meta-page-service/meta-page.service';
import {MetaEntityService} from '../../../meta/entity/meta-entity-service/meta-entity.service';
import {FormArrayWithAttribute, FormControlWithAttribute, FormService} from '../../data-edit/form-service/form.service';
import {MetaEntity} from '../../../domain/meta.entity';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {CardItemDialogComponent} from './controls/card-item-dialog/card-item-dialog.component';


// This file contains many Components because they have a circular dependency on the top-level component of
// LayoutComponent. When Angular builds this as a library it doesn't allow this sort of circular dependency to
// exist in separate files, but is ok if all the components are in a single file. It also allows this situation if
// you are building as an application (but not a library). See the following Angular error for what this coding structure
// is solving. NG3003: One or more import cycles would need to be created to compile this component

@Component({
  selector: 'lib-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent implements OnInit {

  @Input()
  mode: string | null;

  @Input()
  template: Template;

  @Input()
  formGroup: FormGroup;

  @Input()
  relationshipProperty: string;

  constructor() { }

  ngOnInit(): void {
  }
}


@Component({
  selector: 'lib-table-layout',
  templateUrl: './table-layout.component.html',
  styleUrls: ['./table-layout.component.css']
})
export class TableLayoutComponent implements OnInit {

  @Input()
  mode: string | null;

  @Input()
  template: Template;

  @Input()
  formGroup: FormGroup;

  @Input()
  relationshipProperty: string;

  cells$: Observable<CellAttribute[][]>;

  // we need metaEntityList because of how new rows are added to the table
  metaEntityList: MetaEntity[];

  constructor(private metaEntityService: MetaEntityService,
              private formService: FormService) { }

  ngOnInit(): void {
    this.metaEntityService.findAll().subscribe(metaEntityList => {
      this.metaEntityList = metaEntityList;
    });

    this.cells$ = this.metaEntityService.findById(this.template.metaEntityName).pipe(switchMap((metaEntity) => {
      const cells: CellAttribute[][] = this.formService.toCellAttributeArray(this.template, metaEntity);
      return of(cells);
    }));
  }

  get attributes() {
    return this.formGroup.get(this.relationshipProperty) as FormArray;
  }

  getFormGroupForRow(rowIdx: number) {
    return this.attributes.at(rowIdx) as FormGroup;
  }

  onAddRow() {
    if(this.mode === 'edit') {
      const formGroup = this.formService.createFormGroup(this.mode, this.template, this.metaEntityList, null);
      this.attributes.push(formGroup);
    }
  }
}

export interface CardItem {
  discriminatorValue: string;
  metaEntityName: string;
  metaPageName: string;
}

@Component({
  selector: 'lib-card-layout',
  templateUrl: './card-layout.component.html',
  styleUrls: ['./card-layout.component.css']
})
export class CardLayoutComponent implements OnInit {

  @Input()
  mode: string | null;

  //@Input()
  //template: Template;

  @Input()
  formGroup: FormGroup;

  @Input()
  relationshipProperty: string;

  // we need metaEntityList because of how new rows are added to the table
  metaEntityList: MetaEntity[];

  // a map of MetaPages, probably should only fetch the ones we need
  metaPageMap = new Map<string, MetaPage>();

  cardItemMap = new Map<string, CardItem>();

  constructor(private modalService: NgbModal,
              private metaEntityService: MetaEntityService,
              private metaPageService: MetaPageService,
              private fb: FormBuilder,
              private formService: FormService) {

    // TODO: make this more dynamic and allow the user to define it themselves
    // this.template = new Template();
    // this.template.metaEntityName = 'Activity';
    // this.template.type = TemplateType.card;
    // this.template.cells = [];
    // this.template.cells.push([
    //   //{attributeName: 'activity_type', component: ComponentType.Select, width: '3', height: '2'}
    // ]);

    this.cardItemMap.set('Health', {
      discriminatorValue: 'Health',
      metaEntityName: 'HealthActivity',
      metaPageName: 'HealthActivity.view_edit'
    });

    this.cardItemMap.set('Measurement', {
      discriminatorValue: 'Measurement',
      metaEntityName: 'MeasurementActivity',
      metaPageName: 'MeasurementActivity.view_edit'
    });

    this.cardItemMap.set('Weight', {
      discriminatorValue: 'Weight',
      metaEntityName: 'WeightActivity',
      metaPageName: 'WeightActivity.view_edit'
    });
  }

  ngOnInit(): void {
    this.metaEntityService.findAll().subscribe(metaEntityList => {
      this.metaEntityList = metaEntityList;
    });

    this.metaPageService.findAll().subscribe(metaPageList => {
      for(const metaPage of metaPageList) {
        this.metaPageMap.set(metaPage.name, metaPage);
      }
    });
  }

  get attributes() {
    return this.formGroup.get(this.relationshipProperty) as FormArrayWithAttribute;
  }

  getFormGroupForRow(rowIdx: number) {
    return this.attributes.at(rowIdx) as FormGroup;
  }

  getMetaPageForRow(rowIdx: number): MetaPage {
    const formControlWithAttribute = (this.getFormGroupForRow(rowIdx) as unknown) as FormControlWithAttribute;
    const item = formControlWithAttribute.value;
    const discriminatorValue = item.activity_type;
    const cardItem = this.cardItemMap.get(discriminatorValue);
    if(cardItem) {
      const metaPage = this.metaPageMap.get(cardItem.metaPageName);
      if(metaPage) {
        return metaPage;
      }
    }
    throw new Error(`Unable to find MetaPage for rowIdx ${rowIdx}`);
  }

  getHeadingForRow(rowIdx: number): string {
    return this.getMetaPageForRow(rowIdx)?.title;
  }

  getTemplateForRow(rowIdx: number): Template {
    return this.getMetaPageForRow(rowIdx).templates[0];
  }

  onAddItem() {
    if(this.mode === 'edit') {
      const modalRef = this.modalService.open(CardItemDialogComponent);
      const cardItemDialog = modalRef.componentInstance as CardItemDialogComponent;
      cardItemDialog.metaAttribute = this.attributes.attribute;

      const self = this;
      modalRef.closed.subscribe((a) => {

        const discriminatorValue = a.itemSelect;
        console.log(`Modal closed: discriminatorValue = ${JSON.stringify(discriminatorValue)}`);
        const cardItem = this.cardItemMap.get(discriminatorValue);
        console.log(`CardItem`, cardItem);

        if(cardItem && cardItem.metaPageName) {
          const metaPage = this.metaPageMap.get(cardItem.metaPageName);
          if(metaPage && metaPage.templates.length > 0) {
            const template = metaPage.templates[0];

            if(self.mode) {
              const formGroup = this.formService.createFormGroup(self.mode, template, self.metaEntityList, null);
              formGroup.addControl('activity_type', this.fb.control(''));
              this.attributes.push(formGroup);

              const item = {
                activity_type: discriminatorValue
              };

              formGroup.patchValue(item);
            }
          }
        }
      });
    }
  }
}


@Component({
  selector: 'lib-form-layout',
  templateUrl: './form-layout.component.html',
  styleUrls: ['./form-layout.component.css']
})
export class FormLayoutComponent implements OnInit {

  @Input()
  mode: string | null;

  @Input()
  template: Template;

  @Input()
  formGroup: FormGroup;


  cells$: Observable<CellAttribute[][]>;

  constructor(private metaEntityService: MetaEntityService,
              private formService: FormService) { }

  ngOnInit(): void {
    this.cells$ = this.metaEntityService.findById(this.template.metaEntityName).pipe(switchMap((metaEntity) => {
      const cells: CellAttribute[][] = this.formService.toCellAttributeArray(this.template, metaEntity);
      return of(cells);
    }));
  }

  getCSS(cell: Cell): string[] {
    return [
      `col-${cell.width}`
    ];
  }
}

@Component({
  selector: 'lib-cell',
  templateUrl: './cell.component.html',
  styleUrls: ['./cell.component.css']
})
export class CellComponent implements OnInit {

  @Input()
  mode: string | null;

  @Input()
  cell: CellAttribute;

  @Input()
  formGroup: FormGroup;

  constructor() { }

  ngOnInit(): void {
  }
}


@Component({
  selector: 'lib-one-to-many-control',
  templateUrl: './one-to-many-control.component.html',
  styleUrls: ['./one-to-many-control.component.css']
})
export class OneToManyControlComponent implements OnInit {

  @Input()
  mode: string | null;

  @Input()
  cell: CellAttribute;

  @Input()
  formGroup: FormGroup;

  constructor() { }

  ngOnInit(): void {
  }
}


@Component({
  selector: 'lib-one-to-poly-control',
  templateUrl: './one-to-poly-control.component.html',
  styleUrls: ['./one-to-poly-control.component.css']
})
export class OneToPolyControlComponent implements OnInit {

  @Input()
  mode: string | null;

  @Input()
  cell: CellAttribute;

  @Input()
  formGroup: FormGroup;

  constructor() { }

  ngOnInit(): void {
  }

}


@Component({
  selector: 'lib-one-to-one-control',
  templateUrl: './one-to-one-control.component.html',
  styleUrls: ['./one-to-one-control.component.css']
})
export class OneToOneControlComponent implements OnInit {

  @Input()
  mode: string | null;

  @Input()
  cell: CellAttribute;

  @Input()
  formGroup: FormGroup;

  childCells: CellAttribute[][];
  childFormGroup: FormGroup;

  constructor(protected readonly formService: FormService, protected readonly metaEntityService: MetaEntityService) { }

  ngOnInit(): void {
    if(this.cell && this.cell.attribute) {
      const attribute = this.cell.attribute;
      const childMetaEntityName = attribute.relationshipTarget;
      const childTemplate = this.cell.template;
      this.metaEntityService.findById(childMetaEntityName).subscribe(metaEntity => {
        if(childTemplate) {
          this.childCells = this.formService.toCellAttributeArray(childTemplate, metaEntity);
          this.childFormGroup = this.formGroup.controls[attribute.name] as FormGroup;
        }
      });
    }
  }

  isReadOnly() {
    return this.mode === 'view' ? true : null;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['cell']) {
      this.onCellChange(changes['cell'].currentValue);
    }
  }

  onCellChange(cell: CellAttribute) {
    if(!cell.template) {
      if(cell && cell.attribute) {
        const attribute = cell.attribute;
        const template = new Template();
        template.type = TemplateType.table;
        template.metaEntityName = attribute.relationshipTarget;
        cell.template = template;
      }
    }
  }
}

