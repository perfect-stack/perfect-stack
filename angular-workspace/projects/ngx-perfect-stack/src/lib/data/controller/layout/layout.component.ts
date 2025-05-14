import {Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {
  ButtonGroupTool,
  ButtonTabsTool, ButtonTool,
  Cell, DurationTool, IconTool, ImageTool, LabelLayoutType, LastSignInTool, LinkTool, MapTool,
  MetaPage, PageTitleTool, PaginateTool, TabTool,
  Template,
  TemplateLocationType,
  TemplateType, TextTool, Tool,
  ToolType
} from '../../../domain/meta.page';
import {
  AbstractControl,
  ControlValueAccessor,
  NgControl,
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormGroup
} from '@angular/forms';
import {Observable, of, Subscription, switchMap} from 'rxjs';
import {CellAttribute, MetaPageService} from '../../../meta/page/meta-page-service/meta-page.service';
import {MetaEntityService} from '../../../meta/entity/meta-entity-service/meta-entity.service';
import {
  FormArrayWithAttribute,
  FormContext,
  FormService
} from '../../data-edit/form-service/form.service';
import {AttributeType, MetaAttribute, MetaEntity} from '../../../domain/meta.entity';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {CardItemDialogComponent} from './controls/card-item-dialog/card-item-dialog.component';
import {DiscriminatorMapping, DiscriminatorService} from '../../data-service/discriminator.service';
import {DebugService} from '../../../utils/debug/debug.service';
import {Router} from '@angular/router';
import {FormGroupService} from '../../data-edit/form-service/form-group.service';
import {PropertySheetService} from '../../../template/property-sheet/property-sheet.service';
import {EventService} from '../../../event/event.service';
import {Duration, Instant} from '@js-joda/core';


// This file contains many Components because they have a circular dependency on the top-level component of
// LayoutComponent "lib-layout". When Angular builds this as a library it doesn't allow this sort of circular dependency to
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
  formGroup: UntypedFormGroup;

  @Input()
  relationshipProperty: string;

  @Input()
  metaEntity: MetaEntity;

  @Input()
  ctx: FormContext | null;

  @Input()
  showTemplateHeadings = true;

  hasBottomLocations = false;

  constructor(public readonly debugService: DebugService) { }

  ngOnInit(): void {
    if(this.template && this.template.locations) {
      this.hasBottomLocations =
        this.template.locations[TemplateLocationType.BottomLeft] !== undefined
        || this.template.locations[TemplateLocationType.BottomMiddle] !== undefined
        || this.template.locations[TemplateLocationType.BottomRight] !== undefined;
    }

    if(this.ctx) {
      this.mode = this.ctx.mode;
      this.metaEntity = this.ctx.metaEntityMap.get(this.template.metaEntityName) as MetaEntity;
      if(!this.formGroup && this.ctx.formMap && this.template.binding) {
        this.formGroup = this.ctx.formMap.get(this.template.binding) as UntypedFormGroup;
        this.relationshipProperty = this.template.binding;
      }
    }
  }

  getFormGroupForTemplate(template: Template): UntypedFormGroup {
    if(this.ctx && this.ctx.formMap && template.binding) {
      return this.ctx.formMap.get(template.binding) as unknown as UntypedFormGroup;
    }
    else if(template.binding) {
      const fg = this.formGroup.get(template.binding);
      if(fg) {
        return fg as UntypedFormGroup;
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
  formGroup: UntypedFormGroup;

  @Input()
  relationshipProperty: string;

  cells$: Observable<CellAttribute[][]>;

  metaEntityMap: Map<string, MetaEntity>;
  metaPageMap: Map<string, MetaPage>;

  constructor(protected readonly metaEntityService: MetaEntityService,
              protected readonly router: Router,
              protected readonly formService: FormService,
              protected readonly formGroupService: FormGroupService) { }

  ngOnInit(): void {
    this.mode = this.mode ? this.mode : this.ctx.mode;
    if(!this.formGroup && this.ctx.formMap && this.template.binding) {
      console.log(`TableLayoutComponent: template.binding = ${this.template.binding} formMap contains:`, this.ctx.formMap);
      this.formGroup = this.ctx.formMap.get(this.template.binding) as UntypedFormGroup;
      this.relationshipProperty = this.template.binding;
    }
    else {
      `TableLayoutComponent: template.binding = ${this.template.binding} did not get formGroup from formMap`
    }

    console.log(`TableLayoutComponent: template.binding = ${this.template.binding} found formGroup:`, this.formGroup);

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

  get attributes(): UntypedFormArray | null {
    return this.formGroup && this.relationshipProperty ? this.formGroup.get(this.relationshipProperty) as UntypedFormArray : null;
  }

  getFormGroupForRow(rowIdx: number): UntypedFormGroup | null {
    return this.attributes ? this.attributes.at(rowIdx) as UntypedFormGroup : null;
  }

  onAddRow() {
    if(this.mode === 'edit') {
      const formGroup = this.formGroupService.createFormGroup(this.mode, this.template.metaEntityName, this.metaPageMap, this.metaEntityMap, null);
      if(this.attributes) {
        console.log('onAddRow()');
        this.attributes.push(formGroup);
      }
      else {
        console.warn('Unable to find the attributes for this relationship. Is the binding name correct? For example media_files instead of mediaFiles');
      }
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
            let url = route.replace('${id}', id);
            if(url.includes('?')) {
              url += `&fromId=${this.ctx.id}`;
            }
            console.log(`Navigating to route: ${url}`);
            this.router.navigateByUrl(url);
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
    if(this.attributes) {
      this.attributes.removeAt(i);
    }
  }

  getStyleClasses() {
    let styleClasses = '';

    // Commented this bit out as part of adding MediaComponent, it was wrapping the event table inside of a contain-bord-radius
    // if(this.template.styles) {
    //   styleClasses += this.template.styles;
    // }

    if(this.template.navigation === 'Enabled') {
      styleClasses += ' table-hover row-navigation';
    }

    return styleClasses;
  }

  getNoItemsHtml() {
    return this.template.noItemsHtml ? this.template.noItemsHtml : 'No items';
  }

  hasResultsSummary() {
    return this.formGroup.get('resultsSummary') !== null && this.formGroup.get('resultsSummary')?.value.length > 0;
  }

  getCellWidth(nextCell: CellAttribute) {
    return nextCell.width === '0' ? '0%' : 'auto';
  }
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

  // CardLayout doesn't have a Template like Table and Form does, but is allowed to know the Cell it sits in.
  @Input()
  cell: Cell;

  @Input()
  ctx: FormContext;

  @Input()
  formGroup: UntypedFormGroup;

  @Input()
  relationshipProperty: string;

  metaEntityMap$: Observable<Map<string, MetaEntity>>;
  metaPageMap$: Observable<Map<string, MetaPage>>;
  discriminatorMap$ = this.discriminatorService.discriminatorMap$;

  constructor(private modalService: NgbModal,
              private metaEntityService: MetaEntityService,
              private metaPageService: MetaPageService,
              private discriminatorService: DiscriminatorService,
              private fb: UntypedFormBuilder,
              private formGroupService: FormGroupService) {}

  ngOnInit(): void {

    console.log('CardLayout: ngOnInit(): formGroup', this.formGroup);
    console.log('CardLayout: ngOnInit(): relationshipProperty', this.relationshipProperty);

    this.metaEntityMap$ = this.metaEntityService.metaEntityMap$;
    this.metaPageMap$ = this.metaPageService.metaPageMap$;
    this.discriminatorMap$ = this.discriminatorService.discriminatorMap$;
  }

  get attributes() {
    return this.formGroup.get(this.relationshipProperty) as FormArrayWithAttribute;
  }

  get attributeDiscriminator() {
    const attribute = this.attributes.attribute;
    if(attribute) {
      const discriminator = attribute.discriminator;
      if (discriminator) {
        return discriminator;
      }
      else {
        throw new Error(`No discriminator defined for attribute ${attribute.name}`);
      }
    }
    else {
      throw new Error(`No attribute found`);
    }
  }

  getFormGroupForRow(rowIdx: number) {
    return this.attributes.at(rowIdx) as UntypedFormGroup;
  }

  getCardItem(rowIdx: number, discriminatorMap: Map<string, Map<string, DiscriminatorMapping>>) {
    const attribute = this.attributes.attribute;
    if(attribute) {
      const discriminator = attribute.discriminator;
      if(discriminator) {
        const formGroup = this.getFormGroupForRow(rowIdx);
        if(formGroup) {
          const discriminatorControl = formGroup.controls[discriminator.discriminatorName + '_id'];
          if(discriminatorControl) {
            const discriminatorValue = discriminatorControl.value
            if (discriminatorValue) {
              const discriminator = discriminatorMap.get(attribute.name);
              if(discriminator) {
                const discriminatorMapping = discriminator.get(discriminatorValue);
                if(discriminatorMapping) {
                  return {
                    discriminatorId: discriminatorMapping.discriminatorId,
                    discriminatorValue: discriminatorValue,
                    metaEntityName: discriminatorMapping.metaEntityName,
                    metaPageName: discriminatorMapping.metaPageName
                  }
                }
                else {
                  throw new Error(`Unable to find discriminatorMapping for rowIdx ${rowIdx}, discriminatorValue = ${JSON.stringify(discriminatorValue)}`);
                }
              }
              else {
                throw new Error(`Unable to find discriminatorMap for ${attribute.name}`);
              }
            }
            else {
              throw new Error(`Unable to find discriminatorValue for ${attribute.discriminator.discriminatorName}`);
            }
          }
          else {
            throw new Error(`Unable to find discriminatorControl for ${attribute.discriminator.discriminatorName}`);
          }
        }
        else {
          throw new Error(`Unable to find formGroup for rowIdx ${rowIdx}`);
        }
      }
      else {
        throw new Error(`No discriminator defined for attribute ${attribute.name}`);
      }
    }
    else {
      throw new Error(`No attribute found for rowIdx ${rowIdx}`);
    }
  }

  getMetaPageForRow(rowIdx: number,
                    metaPageMap: Map<string, MetaPage>,
                    discriminatorMap: Map<string, Map<string, DiscriminatorMapping>>): MetaPage {
    const cardItem = this.getCardItem(rowIdx, discriminatorMap)
    const metaPage = metaPageMap.get(cardItem.metaPageName);
    if(metaPage) {
      return metaPage;
    }
    else {
      throw new Error(`Unable to find MetaPage for rowIdx ${rowIdx}`);
    }
  }

  getHeadingForRow(rowIdx: number,
                   metaPageMap: Map<string, MetaPage>,
                   discriminatorMap: Map<string, Map<string, DiscriminatorMapping>>): string {
    return this.getMetaPageForRow(rowIdx, metaPageMap, discriminatorMap)?.title;
  }

  getTemplateForRow(rowIdx: number,
                    metaPageMap: Map<string, MetaPage>,
                    discriminatorMap: Map<string, Map<string, DiscriminatorMapping>>): Template {
    return this.getMetaPageForRow(rowIdx, metaPageMap, discriminatorMap).templates[0];
  }

  onAddItem(metaPageMap: Map<string, MetaPage>,
            metaEntityMap: Map<string, MetaEntity>,
            discriminatorMap: Map<string, Map<string, DiscriminatorMapping>>) {
    if(this.mode === 'edit') {

      const disabledList: string[] = [];
      for(const formGroupRow of this.attributes.controls) {
        if(formGroupRow instanceof UntypedFormGroup) {
          disabledList.push(formGroupRow.controls['activity_type_id'].value);
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
            this.addOneItem(self.mode, nextItemName, metaPageMap, metaEntityMap, discriminatorMap);
          }
        }
      });
    }
  }

  addOneItem(mode: string | null,
             discriminatorValue: string,
             metaPageMap: Map<string, MetaPage>,
             metaEntityMap: Map<string, MetaEntity>,
             discriminatorMap: Map<string, Map<string, DiscriminatorMapping>>) {

    const cardItemList = [];
    const attributeDiscriminator = this.attributeDiscriminator;
    const discriminator = discriminatorMap.get(this.relationshipProperty);
    if(discriminator) {
      for(const nextMapping of attributeDiscriminator.entityMappingList) {
        if(nextMapping.discriminatorValue == discriminatorValue) {
          cardItemList.push(discriminator.get(nextMapping.discriminatorValue));
        }
      }
    }
    else {
      throw new Error(`Unable to find discriminator for ${this.relationshipProperty}`)
    }

    if(cardItemList.length === 0 || cardItemList.length > 1) {
      throw new Error(`Unable to find cardItem for discriminatorValue ${discriminatorValue}`);
    }

    const cardItem = cardItemList[0];
    if(cardItem && cardItem.metaPageName) {
      const metaPage = metaPageMap.get(cardItem.metaPageName);
      if(metaPage && metaPage.templates.length > 0) {
        const template = metaPage.templates[0];

        if(mode) {
          // create the new item formGroup
          const itemFormGroup = this.formGroupService.createFormGroup(mode, template.metaEntityName, metaPageMap, metaEntityMap, null);
          itemFormGroup.addControl('activity_type_id', this.fb.control(''));

          const discriminatorId = cardItem.discriminatorId;

          // create the new mostly empty item
          const item:any = {
            activity_type_id: discriminatorId,
            //activity_type: discriminatorValue
          };

          // update the item formGroup
          itemFormGroup.patchValue(item);

          // add the populated item formGroup to our parent form based on the relationshipTarget "attributes"
          this.attributes.push(itemFormGroup);
          console.log('Created formGroup and added new item successfully.');
          console.log(' - ctx:', this.ctx);
          console.log(' - item:', item);
          console.log(' - itemFormGroup:', itemFormGroup);
        }
      }
    }
  }

  onDeleteItem(rowIdx: number) {
    this.attributes.removeAt(rowIdx);
  }

  getNoItemsHtml() {
    return this.cell.noItemsHtml ? this.cell.noItemsHtml : 'No items';
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
  formGroup: UntypedFormGroup;

  @Input()
  metaEntity: MetaEntity;

  cells$: Observable<CellAttribute[][]>;

  constructor(public readonly debugService: DebugService,
              private metaEntityService: MetaEntityService,
              private formService: FormService) { }

  ngOnInit(): void {
    if(this.ctx && this.ctx.formMap) {
      console.log('FormLayoutComponent: initialising things the new way');
      console.log(' - formGroup:', this.formGroup);
      if(!this.template) {
        throw new Error('No template defined, cannot proceed sensibly');
      }

      this.mode = this.ctx.mode;
      if(this.formGroup) {
        console.log(' - formGroup is supplied return early');
        return;
      }

      let formLookupKey;
      let form;
      const binding = this.template.binding;
      if(binding) {
        if(binding.indexOf('.') >= 0) {
          formLookupKey = binding.substring(0, binding.indexOf('.'));
          const childFormGroup = binding.substring(binding.indexOf('.') + 1);
          console.log(`Binding NESTED for: ${binding}, formLookupKey = "${formLookupKey}", childFormGroup = "${childFormGroup}"`);
          form = this.ctx.formMap.get(formLookupKey) as UntypedFormGroup;
          form = form.controls[childFormGroup] as UntypedFormGroup;
        }
        else {
          formLookupKey = binding;
          form = this.ctx.formMap.get(formLookupKey) as UntypedFormGroup;
          console.log(`Binding ROOT - ${binding}`);
          console.log(' - form:', form);
        }

        this.formGroup = form;
      }
      else {
        console.warn(`BINDING: "${binding}" - NOT FOUND. Keep calm and carry on but you might be getting NG01052: formGroup expects a FormGroup instance from here onwards 🙂`);
      }
    }
    else {
      console.warn('UNABLE to initialise FormLayoutComponent sensibly');
    }
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

  isShowLabel(cell: CellAttribute) {
    const hiddenAttributeTypes = new Set<AttributeType>([AttributeType.OneToPoly, AttributeType.Boolean]);
    const hideAttributeType = cell && cell.attribute && hiddenAttributeTypes.has(cell.attribute.type);
    const hideLabel = cell.hideLabel || cell.labelLayout === LabelLayoutType.Hidden;
    return !(hideAttributeType || hideLabel);
  }

  isShowLabelTop(cell: CellAttribute): boolean {
    // We default to "Top" if not supplied
    return cell.labelLayout === undefined || cell.labelLayout === LabelLayoutType.Top;
  }

  isShowLabelLeft(cell: CellAttribute): boolean {
    return cell.labelLayout === LabelLayoutType.Left;
  }

  get AttributeType() {
    return AttributeType;
  }

  isFormRow(row: CellAttribute[]) {
    // Was in a hurry and needed to suppress the form-row class on rows that used the Map component. Ideally the Row
    // object of the MetaPage would have metadata to control this, but have gone with a hunt-and-shoot-to-kill approach
    // for now. If the row has one cell and that Cell is a ToolView, and it has a Map component then "form-row" is
    // disabled.
    return !(row && row.length === 1 && row[0].tool && row[0].tool.type === 'Map');
  }

}

@Component({
  selector: 'lib-header-layout',
  templateUrl: './header-layout.component.html',
  styleUrls: ['./header-layout.component.css']
})
export class HeaderLayoutComponent implements OnInit, OnChanges {

  @Input()
  mode: string | null;

  @Input()
  ctx: FormContext;

  @Input()
  template: Template;

  @Input()
  formGroup: UntypedFormGroup;

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
          form = this.ctx.formMap.get(formLookupKey) as UntypedFormGroup;
          form = form.controls[childFormGroup] as UntypedFormGroup;
        }
        else {
          formLookupKey = binding;
          console.log(`Binding ROOT - ${binding}`)
          form = this.ctx.formMap.get(formLookupKey) as UntypedFormGroup;
        }

        this.formGroup = form;
      }
      else {
        console.log('Binding - Not found. Keep calm and carry on 🙂');
      }
    }
    else {
      console.warn('UNABLE to initialise FormLayoutComponent sensibly');
    }

    //this.updateCells$();
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

  isShowLabel(cell: CellAttribute) {
    const hideLabelsSet = new Set<AttributeType>([AttributeType.OneToPoly, AttributeType.Boolean]);
    return cell && cell.attribute ? !hideLabelsSet.has(cell.attribute.type) : true;
  }

  get AttributeType() {
    return AttributeType;
  }

  isFormRow(row: CellAttribute[]) {
    // Was in a hurry and needed to suppress the form-row class on rows that used the Map component. Ideally the Row
    // object of the MetaPage would have metadata to control this, but have gone with a hunt-and-shoot-to-kill approach
    // for now. If the row has one cell and that Cell is a ToolView, and it has a Map component then "form-row" is
    // disabled.
    return !(row && row.length === 1 && row[0].tool && row[0].tool.type === 'Map');
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
  formGroup: UntypedFormGroup;

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
  ctx: FormContext;

  @Input()
  cell: CellAttribute;

  @Input()
  formGroup: UntypedFormGroup;

  constructor() { }

  ngOnInit(): void {
    console.log('OneToManyControlComponent - init');
    console.log(' - formGroup:', this.formGroup);
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
  ctx: FormContext;

  @Input()
  cell: CellAttribute;

  @Input()
  formGroup: UntypedFormGroup;

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
  formGroup: UntypedFormGroup;

  childCells: CellAttribute[][];
  childFormGroup: UntypedFormGroup;

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
          this.childFormGroup = this.formGroup.controls[attribute.name] as UntypedFormGroup;
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

@Component({
  selector: 'lib-spy-control',
  templateUrl: './controls/spy-control/spy-control.component.html',
  styleUrls: ['./controls/spy-control/spy-control.component.css']
})
export class SpyControlComponent implements OnInit, OnDestroy, ControlValueAccessor {

  @Input()
  mode: string;

  @Input()
  formGroup: UntypedFormGroup;

  @Input()
  cell: CellAttribute;

  @Input()
  attribute: MetaAttribute;

  disabled = false;
  spyTemplate: string;

  targetValue: any;

  spyCtx$: Observable<FormContext>;

  formGroupSubscription: Subscription;

  constructor(protected readonly formService: FormService,
              public ngControl: NgControl) {
    ngControl.valueAccessor = this;
  }

  ngOnInit(): void {
    if(this.cell && this.cell.component) {
      this.spyTemplate = (this.cell as any).spyTemplate;
    }

    if(this.formGroup && this.attribute) {
      this.formGroupSubscription = this.formGroup.controls[this.attribute.name + '_id'].valueChanges.subscribe((nextValue) => {
        console.log(`Spy detects update in target attribute ${this.attribute.relationshipTarget}`, nextValue);
        this.targetValue = nextValue;

        const metaName = this.attribute.relationshipTarget;
        const mode = 'view';
        const entityId = nextValue;

        this.spyCtx$ = this.formService.loadFormContext(metaName, mode, entityId, null, null);
      });
    }
  }

  getSpyTemplate(metaPageMap: Map<string, MetaPage>) {
    const metaPage = metaPageMap.get(this.spyTemplate);
    if(metaPage) {
      return metaPage.templates[0];
    }
    else {
      throw new Error(`Unable to find spy template for: ${this.spyTemplate}`);
    }
  }

  set value(val: string){

    // spy control doesn't update anything, it only watches the field it's bound to

    // this.selectedEntityId = val
    // this.onChange(val)
  }

  onChange: any = () => {}
  onTouch: any = () => {}

  registerOnChange(fn: any): void {
    this.onChange = fn
  }

  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  writeValue(obj: any): void {
    this.value = obj;
  }

  ngOnDestroy(): void {
    if(this.formGroupSubscription) {
      this.formGroupSubscription.unsubscribe();
    }
  }
}

@Component({
  selector: 'lib-tool-view',
  templateUrl: './tool-view/tool-view.component.html',
  styleUrls: ['./tool-view/tool-view.component.css']
})
export class ToolViewComponent implements OnInit {

  @Input()
  tool: Tool;

  @Input()
  ctx: FormContext;

  @Input()
  editorMode = false;

  @Input()
  formGroup: UntypedFormGroup;

  constructor() { }

  ngOnInit(): void {
  }

  asButtonTool() {
    return this.tool as ButtonTool;
  }

  asButtonGroupTool() {
    return this.tool as ButtonGroupTool;
  }

  asButtonTabsTool() {
    return this.tool as ButtonTabsTool;
  }

  asDurationTool() {
    return this.tool as DurationTool;
  }

  asImageTool() {
    return this.tool as ImageTool;
  }

  asLastSignInTool() {
    return this.tool as LastSignInTool;
  }

  asLinkTool() {
    return this.tool as LinkTool;
  }

  asMapTool() {
    return this.tool as MapTool;
  }

  asPageTitleTool() {
    return this.tool as PageTitleTool;
  }

  asPaginateTool() {
    return this.tool as PaginateTool;
  }

  asTabTool() {
    return this.tool as TabTool;
  }

  asTextTool() {
    return this.tool as TextTool;
  }

  asIconTool() {
    return this.tool as IconTool;
  }

  isToolVisible() {
    const modes = this.tool.modes;
    if(modes && this.ctx && this.ctx.mode) {
      return modes.indexOf(this.ctx.mode) >= 0;
    }
    else {
      // If no list of modes is defined then the tool is always visible
      return true;
    }
  }

}

@Component({
  selector: 'lib-button-tabs-tool',
  templateUrl: './tool-view/button-tabs-tool/button-tabs-tool.component.html',
  styleUrls: ['./tool-view/button-tabs-tool/button-tabs-tool.component.css']
})
export class ButtonTabsToolComponent implements OnInit {

  @Input()
  buttonTabsTool: ButtonTabsTool;

  @Input()
  ctx: FormContext;

  @Input()
  editorMode = false;

  tabContext$: Observable<ButtonTabContext>;
  selectedTemplate: Template;

  constructor(protected readonly propertySheetService: PropertySheetService,
              protected readonly metaPageService: MetaPageService,
              protected readonly eventService: EventService,) { }

  ngOnInit(): void {
    this.tabContext$ = this.metaPageService.metaPageMap$.pipe(switchMap((metaPageMap) => {

      const tabContext = new ButtonTabContext();
      const tabNames: string[] = [];

      let pageNames = this.extractNames(
        this.buttonTabsTool.template1,
        this.buttonTabsTool.template2,
        this.buttonTabsTool.template3,
        this.buttonTabsTool.template4,
        this.buttonTabsTool.template5,
        this.buttonTabsTool.template6,
        this.buttonTabsTool.template7,
      );

      if(pageNames.length > 0) {
        for(const nextPageName of pageNames) {
          const metaPage = metaPageMap.get(nextPageName);
          if(metaPage) {
            tabNames.push(metaPage.title);
            tabContext.tabMap.set(metaPage.title, metaPage);
          }
        }
      }
      else {
        tabNames.push('Undefined');
      }

      const buttonGroupTool = tabContext.buttonGroupTool;
      buttonGroupTool.type = ToolType.ButtonGroup;
      buttonGroupTool.containerStyles = this.buttonTabsTool.containerStyles;
      buttonGroupTool.styles = this.buttonTabsTool.styles;
      buttonGroupTool.label = tabNames.join(',');
      buttonGroupTool.action = tabNames.join(',');

      // set the initial tab
      console.log(`Set initial tab = ${tabNames[0]}`);
      this.onTabSelected(tabNames[0], tabContext);

      return of(tabContext);
    }));
  }

  extractNames(...names: string[]) {
    return names.filter(s => s !== null && s.length > 0);
  }

  onClick(buttonName: string) {
    if(this.editorMode) {
      this.doEditorAction();
    }
    else {
      this.doApplicationAction(buttonName);
    }
  }

  doEditorAction() {
    // trigger the PropertySheetService to start editing it
    this.propertySheetService.edit('Button Tabs', this.buttonTabsTool);
  }

  doApplicationAction(buttonName: string) {
  }

  onTabSelected(tabName: string, tabContext: ButtonTabContext) {
    console.log(`Button Tab selected: ${tabName}, templateIndex = ${this.buttonTabsTool.templateIndex}.`);
    const tabMetaPage = tabContext.tabMap.get(tabName);
    if(tabMetaPage) {
      console.log(`Button Tab metaPage = ${tabMetaPage.name}`);
      this.selectedTemplate = tabMetaPage.templates[0];
    }
  }
}

export class ButtonTabContext {
  buttonGroupTool = new ButtonGroupTool();
  tabMap = new Map<string, MetaPage>();
}

@Component({
  selector: 'lib-duration-tool',
  templateUrl: './tool-view/duration-tool/duration-tool.component.html',
  styleUrls: ['./tool-view/duration-tool/duration-tool.component.css']
})
export class DurationToolComponent implements OnInit, OnDestroy {

  @Input()
  durationTool: DurationTool;

  @Input()
  ctx: FormContext;

  @Input()
  editorMode = false;

  startDateTimeControl: AbstractControl;
  endDateTimeControl: AbstractControl;

  startDateTimeSubscription: Subscription;
  endDateTimeSubscription: Subscription;

  durationLabel: string = '-';

  constructor() {
  }

  ngOnInit(): void {
    const formGroup = this.ctx.formMap.values().next().value as UntypedFormGroup;
    this.startDateTimeControl = formGroup.controls['date_time'];
    this.endDateTimeControl = formGroup.controls['end_date_time'];

    this.startDateTimeSubscription = this.startDateTimeControl.valueChanges.subscribe(() => {
      this.updateDuration();
    });

    this.endDateTimeSubscription = this.endDateTimeControl.valueChanges.subscribe(() => {
      this.updateDuration();
    });

    // pump once to get started
    this.updateDuration();
  }

  updateDuration() {
    try {
      const startDateTime = Instant.parse(this.startDateTimeControl.value);
      const endDateTime = Instant.parse(this.endDateTimeControl.value);
      const duration = Duration.between(startDateTime, endDateTime);

      const days = duration.toDays();
      const hours = duration.toHours() - (days * 24);
      const mins = duration.toMinutes() - (days * 24 * 60) - (hours * 60);

      if(days > 0) {
        this.durationLabel = `${days} days ${hours} hours ${mins} mins`;
      }
      else if(hours > 0) {
        this.durationLabel = `${hours} hours ${mins} mins`;
      }
      else {
        this.durationLabel = `${mins} mins`;
      }
    }
    catch (e) {
      // ok to swallow and keep going
    }
  }

  ngOnDestroy(): void {
    if(this.startDateTimeSubscription) {
      this.startDateTimeSubscription.unsubscribe();
    }

    if(this.endDateTimeSubscription) {
      this.endDateTimeSubscription.unsubscribe();
    }
  }
}


@Component({
  selector: 'lib-tab-tool',
  templateUrl: './tool-view/tab-tool/tab-tool.component.html',
  styleUrls: ['./tool-view/tab-tool/tab-tool.component.scss']
})
export class TabToolComponent implements OnInit {

  @Input()
  tabTool: TabTool;

  @Input()
  ctx: FormContext;

  @Input()
  editorMode = false;

  tabContext$: Observable<TabToolContext>;
  selectedMetaPage: MetaPage;
  selectedTemplate: Template;
  selectedTabIdx: number;

  constructor(protected readonly propertySheetService: PropertySheetService,
              protected readonly metaPageService: MetaPageService) { }

  ngOnInit(): void {
    this.tabContext$ = this.metaPageService.metaPageMap$.pipe(switchMap((metaPageMap) => {

      const tabContext = new TabToolContext();

      let pageNames = this.extractNames(
        this.tabTool.template1,
        this.tabTool.template2,
        this.tabTool.template3,
        this.tabTool.template4,
        this.tabTool.template5,
        this.tabTool.template6,
        this.tabTool.template7,
      );

      if(pageNames.length > 0) {
        for(const nextPageName of pageNames) {
          const metaPage = metaPageMap.get(nextPageName);
          if(metaPage) {
            tabContext.tabList.push(metaPage);
          }
          else {
            console.warn(`Unable to find MetaPage for Tab template of ${nextPageName}`);
          }
        }
      }

      // set the initial tab
      if(tabContext.tabList.length > 0) {
        const initialTab = tabContext.tabList[0];
        this.onTabMetaPageSelected(initialTab, 0);
        console.log(`Set initial tab = ${initialTab.name}`);
      }

      return of(tabContext);
    }));
  }

  extractNames(...names: string[]) {
    return names.filter(s => s !== null && s.length > 0);
  }

  onClick() {
    if (this.editorMode) {
      this.doEditorAction();
    }
  }

  doEditorAction() {
    // trigger the PropertySheetService to start editing it
    this.propertySheetService.edit('Tab', this.tabTool);
  }

  onTabMetaPageSelected(tabMetaPage: MetaPage, selectedTabIdx: number) {
    console.log(`Tab Selected: metaPage = ${tabMetaPage.name}`);
    this.selectedMetaPage = tabMetaPage;
    this.selectedTabIdx = selectedTabIdx;
    if(tabMetaPage.templates && tabMetaPage.templates.length > 0) {
      this.selectedTemplate = tabMetaPage.templates[0];
      console.log(`Template Selected: ${this.selectedTemplate.binding}`);
    }
  }
}

class TabToolContext {
  tabList: MetaPage[] = [];
}
