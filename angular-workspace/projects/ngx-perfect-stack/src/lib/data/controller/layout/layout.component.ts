import {Component, Input, OnInit, SimpleChanges} from '@angular/core';
import {Cell, Template, TemplateType} from '../../../domain/meta.page';
import {FormArray, FormGroup} from '@angular/forms';
import {Observable, of, switchMap} from 'rxjs';
import {CellAttribute} from '../../../meta/page/meta-page-service/meta-page.service';
import {MetaEntityService} from '../../../meta/entity/meta-entity-service/meta-entity.service';
import {FormService} from '../../data-edit/form-service/form.service';


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
  selector: 'lib-new-table-layout',
  templateUrl: './new-table-layout.component.html',
  styleUrls: ['./new-table-layout.component.css']
})
export class NewTableLayoutComponent implements OnInit {

  @Input()
  mode: string | null;

  @Input()
  template: Template;

  @Input()
  formGroup: FormGroup;

  @Input()
  relationshipProperty: string;

  cells$: Observable<CellAttribute[][]>;

  constructor(private metaEntityService: MetaEntityService,
              private formService: FormService) { }

  ngOnInit(): void {
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
}

@Component({
  selector: 'lib-new-form-layout',
  templateUrl: './new-form-layout.component.html',
  styleUrls: ['./new-form-layout.component.css']
})
export class NewFormLayoutComponent implements OnInit {

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
  selector: 'lib-new-one-to-many-control',
  templateUrl: './new-one-to-many-control.component.html',
  styleUrls: ['./new-one-to-many-control.component.css']
})
export class NewOneToManyControlComponent implements OnInit {

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
  selector: 'lib-new-one-to-one-control',
  templateUrl: './new-one-to-one-control.component.html',
  styleUrls: ['./new-one-to-one-control.component.css']
})
export class NewOneToOneControlComponent implements OnInit {

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
      console.log(`OneToOneControlComponent: childMetaEntityName = ${childMetaEntityName}`);
      console.log(`OneToOneControlComponent: childTemplate = ${JSON.stringify(this.cell.template)}`);
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

