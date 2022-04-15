import {Component, Input, OnInit} from '@angular/core';
import {Template} from '../../../../domain/meta.page';
import {FormArray, FormGroup} from '@angular/forms';
import {Observable, of, switchMap} from 'rxjs';
import {CellAttribute} from '../../../../meta/page/meta-page-service/meta-page.service';
import {MetaEntityService} from '../../../../meta/entity/meta-entity-service/meta-entity.service';
import {FormService} from '../../../data-edit/form-service/form.service';

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

    const a = this.formGroup.get(this.relationshipProperty) as FormArray;
  }

  get attributes() {
    return this.formGroup.get(this.relationshipProperty) as FormArray;
  }

  getFormGroupForRow(rowIdx: number) {
    return this.attributes.at(rowIdx) as FormGroup;
  }

}
