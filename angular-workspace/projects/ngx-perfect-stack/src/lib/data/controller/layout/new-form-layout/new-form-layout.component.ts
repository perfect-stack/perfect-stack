import {Component, Input, OnInit} from '@angular/core';
import {Cell, Template} from '../../../../domain/meta.page';
import {FormGroup} from '@angular/forms';
import {MetaEntityService} from '../../../../meta/entity/meta-entity-service/meta-entity.service';
import {Observable, of, switchMap} from 'rxjs';
import {CellAttribute} from '../../../../meta/page/meta-page-service/meta-page.service';
import {FormService} from '../../../data-edit/form-service/form.service';

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
