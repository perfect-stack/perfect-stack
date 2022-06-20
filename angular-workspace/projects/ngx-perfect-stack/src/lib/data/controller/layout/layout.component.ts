import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {Cell, MetaPage, Template, TemplateLocationType, TemplateType} from '../../../domain/meta.page';
import {FormArray, FormBuilder, FormGroup} from '@angular/forms';
import {Observable, of, switchMap} from 'rxjs';
import {CellAttribute, MetaPageService} from '../../../meta/page/meta-page-service/meta-page.service';
import {MetaEntityService} from '../../../meta/entity/meta-entity-service/meta-entity.service';
import {
  FormArrayWithAttribute,
  FormContext,
  FormControlWithAttribute,
  FormService
} from '../../data-edit/form-service/form.service';
import {AttributeType, MetaEntity} from '../../../domain/meta.entity';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {CardItemDialogComponent} from './controls/card-item-dialog/card-item-dialog.component';
import {DataService} from '../../data-service/data.service';
import {MessageDialogComponent} from '../../../utils/message-dialog/message-dialog.component';
import {DebugService} from '../../../utils/debug/debug.service';
import {Router} from '@angular/router';


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

  @Input()
  metaEntity: MetaEntity;

  @Input()
  ctx: FormContext | null;

  @Input()
  showTemplateHeadings = true;

  constructor(public readonly debugService: DebugService) { }

  ngOnInit(): void {
    if(this.ctx) {
      this.mode = this.ctx.mode;
      this.metaEntity = this.ctx.metaEntityMap.get(this.template.metaEntityName) as MetaEntity;
      if(!this.formGroup && this.ctx.formMap && this.template.binding) {
        this.formGroup = this.ctx.formMap.get(this.template.binding) as FormGroup;
        this.relationshipProperty = this.template.binding;
      }
    }
  }

  getFormGroupForTemplate(template: Template): FormGroup {
    if(this.ctx && this.ctx.formMap && template.binding) {
      return this.ctx.formMap.get(template.binding) as unknown as FormGroup;
    }
    else if(template.binding) {
      const fg = this.formGroup.get(template.binding);
      if(fg) {
        return fg as FormGroup;
      }
      else {
        throw new Error(`Unable to find formGroup for binding ${template.binding} in controls ${Object.keys(this.formGroup.controls)}`);
      }
    }
    else {
      return this.formGroup;
    }
  }

  getMetaEntity(template: Template): MetaEntity {
    if(this.ctx && this.ctx.formMap && template.metaEntityName) {
      return this.ctx.metaEntityMap.get(template.metaEntityName) as MetaEntity;
    }
    else {
      return this.metaEntity;
    }
  }

  get TemplateLocationType() {
    return TemplateLocationType;
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
  ctx: FormContext;

  @Input()
  template: Template;

  @Input()
  formGroup: FormGroup;

  @Input()
  relationshipProperty: string;

  cells$: Observable<CellAttribute[][]>;

  metaEntityMap: Map<string, MetaEntity>;
  metaPageMap: Map<string, MetaPage>;

  constructor(private readonly metaEntityService: MetaEntityService,
              private readonly router: Router,
              private readonly formService: FormService) { }

  ngOnInit(): void {
    this.mode = this.mode ? this.mode : this.ctx.mode;
    if(!this.formGroup && this.ctx.formMap && this.template.binding) {
      this.formGroup = this.ctx.formMap.get(this.template.binding) as FormGroup;
      this.relationshipProperty = this.template.binding;
    }

    console.log('TableLayoutComponent: found formGroup: ', this.formGroup);

    if(!this.template.metaEntityName) {
      throw new Error(`The template; ${JSON.stringify(this.template)} has no metaEntityName`);
    }

    this.cells$ = this.metaEntityService.metaEntityMap$.pipe(switchMap((metaEntityMap) => {
      this.metaEntityMap = metaEntityMap;
      const metaEntity = this.metaEntityMap.get(this.template.metaEntityName);
      if(metaEntity) {
        const cells: CellAttribute[][] = this.formService.toCellAttributeArray(this.template, metaEntity);
        return of(cells);
      }
      else {
        throw new Error(`Unable to find metaEntity for; ${this.template.metaEntityName}`);
      }
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
      const formGroup = this.formService.createFormGroup(this.mode, this.template, this.metaPageMap, this.metaEntityMap, null);
      this.attributes.push(formGroup);
    }
  }

  onRowClicked(rowIdx: number) {
    console.log(`row clicked: ${rowIdx}`);
    if(this.template.navigation === 'Enabled') {
      const route = this.template.route;
      if(route) {
        const rowData = this.getFormGroupForRow(rowIdx);

        // TODO: this needs to be made more generic and not just hunt for the id, but allow the route to do parameter
        // substitution on any any attribute value. Also don't understand why I wasn't able to jut get "id" from the
        // formGroup value.
        if(rowData) {
          console.log('got rowData: ', rowData);
          const idControl = rowData.controls['id'];
          console.log('got idControl: ', idControl);
          const id = idControl.value;
          console.log('got id value: ', id);
          if(id) {
            const r = route.replace('${id}', id);
            console.log(`Navigating to route: ${r}`);
            this.router.navigate([r]);
          }
          else {
            console.warn(`Unable to find id for row ${rowIdx} in rowData ${JSON.stringify(this.formGroup.value)}`)
          }
        }
        else {
          console.warn(`Unable to find row data for row ${rowIdx}`);
        }
      }
      else {
        console.warn(`Template navigation is enabled but no route has been supplied`, this.template);
      }
    }
  }

  onDeleteRow(i: number) {
    console.log(`delete row: ${i}`);
    this.attributes.removeAt(i);
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
  ctx: FormContext;

  @Input()
  formGroup: FormGroup;

  @Input()
  relationshipProperty: string;

  metaEntityMap$: Observable<Map<string, MetaEntity>>;
  metaPageMap$: Observable<Map<string, MetaPage>>;

  cardItemMap = new Map<string, CardItem>();

  constructor(private modalService: NgbModal,
              private metaEntityService: MetaEntityService,
              private metaPageService: MetaPageService,
              private dataService: DataService,
              private fb: FormBuilder,
              private formService: FormService) {}

  ngOnInit(): void {

    console.log('CardLayout: ngOnInit(): formGroup', this.formGroup);
    console.log('CardLayout: ngOnInit(): relationshipProperty', this.relationshipProperty);

    this.metaEntityMap$ = this.metaEntityService.metaEntityMap$;
    this.metaPageMap$ = this.metaPageService.metaPageMap$;

    // TODO: make this more dynamic and allow the user to define it themselves
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

  get attributes() {
    return this.formGroup.get(this.relationshipProperty) as FormArrayWithAttribute;
  }

  getFormGroupForRow(rowIdx: number) {
    return this.attributes.at(rowIdx) as FormGroup;
  }

  getCardItem(rowIdx: number) {
    const formControlWithAttribute = (this.getFormGroupForRow(rowIdx) as unknown) as FormControlWithAttribute;
    const item = formControlWithAttribute.value;

    const attribute = this.attributes.attribute;
    const discriminator = attribute.discriminator;
    if(discriminator) {
      const discriminatorValue = item[attribute.discriminator.discriminatorName];
      const cardItem = this.cardItemMap.get(discriminatorValue);
      if(cardItem) {
        return cardItem;
      }
      else {
        throw new Error(`Unable to find cardItem for rowIdx ${rowIdx}`);
      }
    }
    else {
      throw new Error(`No discriminator defined for attribute ${attribute.name}`);
    }
  }

  getMetaPageForRow(rowIdx: number, metaPageMap: Map<string, MetaPage>): MetaPage {
    const cardItem = this.getCardItem(rowIdx)
    const metaPage = metaPageMap.get(cardItem.metaPageName);
    if(metaPage) {
      return metaPage;
    }
    else {
      throw new Error(`Unable to find MetaPage for rowIdx ${rowIdx}`);
    }
  }

  getHeadingForRow(rowIdx: number, metaPageMap: Map<string, MetaPage>): string {
    return this.getMetaPageForRow(rowIdx, metaPageMap)?.title;
  }

  getTemplateForRow(rowIdx: number, metaPageMap: Map<string, MetaPage>): Template {
    return this.getMetaPageForRow(rowIdx, metaPageMap).templates[0];
  }

  onAddItem(metaPageMap: Map<string, MetaPage>, metaEntityMap: Map<string, MetaEntity>) {
    if(this.mode === 'edit') {

      const disabledList: string[] = [];
      for(const formGroupRow of this.attributes.controls) {
        if(formGroupRow instanceof FormGroup) {
          disabledList.push(formGroupRow.controls['activity_type'].value);
        }
      }

      console.log(`Dialog should disable the following list: ${disabledList}`);

      const modalRef = this.modalService.open(CardItemDialogComponent);
      const cardItemDialog = modalRef.componentInstance as CardItemDialogComponent;
      cardItemDialog.metaAttribute = this.attributes.attribute;
      cardItemDialog.disabledList = disabledList;

      const self = this;
      modalRef.closed.subscribe((cardItems) => {
        console.log(`Adding card items; ${cardItems}`);
        if(cardItems) {
          for(const nextItemName of cardItems) {
            this.addOneItem(self.mode, nextItemName, metaPageMap, metaEntityMap);
          }
        }
      });
    }
  }

  addOneItem(mode: string | null, discriminatorValue: string, metaPageMap: Map<string, MetaPage>, metaEntityMap: Map<string, MetaEntity>) {
    const cardItem = this.cardItemMap.get(discriminatorValue);
    console.log(`CardItem`, cardItem);

    if(cardItem && cardItem.metaPageName) {
      const metaPage = metaPageMap.get(cardItem.metaPageName);
      if(metaPage && metaPage.templates.length > 0) {
        const template = metaPage.templates[0];

        if(mode) {
          // create the new item formGroup
          const itemFormGroup = this.formService.createFormGroup(mode, template, metaPageMap, metaEntityMap, null);
          itemFormGroup.addControl('activity_type', this.fb.control(''));

          // create the new mostly empty item
          const item = {
            activity_type: discriminatorValue
          };

          // update the item formGroup
          itemFormGroup.patchValue(item);

          // add the populated item formGroup to our parent form based on the relationshipTarget "attributes"
          this.attributes.push(itemFormGroup);
        }
      }
    }
  }

  onDeleteItem(rowIdx: number) {
    const modalRef = this.modalService.open(MessageDialogComponent)
    const modalComponent: MessageDialogComponent = modalRef.componentInstance;
    modalComponent.title = 'Delete Entity Confirmation';
    modalComponent.text = `This action will delete the selected entity. It cannot be undone.`;
    modalComponent.actions = [
      {name: 'Cancel', style: 'btn btn-outline-primary'},
      {name: 'Delete', style: 'btn btn-danger'},
    ];

    modalRef.closed.subscribe((closedResult) => {
      console.log(`Message Dialog closedResult = ${closedResult}`);
      if(closedResult === 'Delete') {
        const formGroup = this.getFormGroupForRow(rowIdx);
        const childEntity = formGroup.value;
        const childEntityId = childEntity.id;

        const cardItem = this.getCardItem(rowIdx);
        const childEntityName = cardItem.metaEntityName

        this.dataService.destroy(childEntityName, childEntityId).subscribe(() => {
          this.attributes.removeAt(rowIdx);
        });
      }
    });
  }
}


@Component({
  selector: 'lib-form-layout',
  templateUrl: './form-layout.component.html',
  styleUrls: ['./form-layout.component.css']
})
export class FormLayoutComponent implements OnInit, OnChanges {

  @Input()
  mode: string | null;

  @Input()
  ctx: FormContext;

  @Input()
  template: Template;

  @Input()
  formGroup: FormGroup;

  @Input()
  metaEntity: MetaEntity;

  cells$: Observable<CellAttribute[][]>;

  constructor(public readonly debugService: DebugService,
              private metaEntityService: MetaEntityService,
              private formService: FormService) { }

  ngOnInit(): void {
    if(this.ctx && this.ctx.formMap) {
      console.log('FormLayoutComponent: initialising things the new way');
      this.mode = this.ctx.mode;

      let formLookupKey;
      let form;
      const binding = this.template.binding;
      if(binding) {
        if(binding.indexOf('.') >= 0) {
          formLookupKey = binding.substring(0, binding.indexOf('.'));
          const childFormGroup = binding.substring(binding.indexOf('.') + 1);
          console.log(`Binding NESTED for: ${binding}, formLookupKey = "${formLookupKey}", childFormGroup = "${childFormGroup}"`);
          form = this.ctx.formMap.get(formLookupKey) as FormGroup;
          form = form.controls[childFormGroup] as FormGroup;
        }
        else {
          formLookupKey = binding;
          console.log(`Binding ROOT - ${binding}`)
          form = this.ctx.formMap.get(formLookupKey) as FormGroup;
        }

        console.log(`Found form: ${this.template.binding}: `, form);
        this.formGroup = form;
      }
      else {
        console.log('Binding - Not found. Keep calm and carry on 🙂');
      }
    }
    else {
      console.warn('UNABLE to initialise FormLayoutComponent sensibly');
    }

    this.updateCells$();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['template']) {
      this.updateCells$();
    }
  }

  updateCells$() {
    if(this.template) {
      this.cells$ = this.metaEntityService.metaEntityMap$.pipe(switchMap((metaEntityMap) => {
        const metaEntity = metaEntityMap.get(this.template.metaEntityName);
        if(metaEntity) {
          const cells: CellAttribute[][] = this.formService.toCellAttributeArray(this.template, metaEntity);
          return of(cells);
        }
        else {
          throw new Error(`Unable to find metaEntity for: ${this.template.metaEntityName}`);
        }
      }));
    }
  }

  getCSS(cell: Cell): string[] {
    return [
      `col-${cell.width}`
    ];
  }

  get AttributeType() {
    return AttributeType;
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

  @Input()
  ctx: FormContext;

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
      this.metaEntityService.metaEntityMap$.subscribe((metaEntityMap) => {
        const metaEntity = metaEntityMap.get(childMetaEntityName);
        if(childTemplate && metaEntity) {
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

