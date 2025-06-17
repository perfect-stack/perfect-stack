import {Component, Input, OnInit} from '@angular/core';
import {UntypedFormGroup} from '@angular/forms';
import {CellAttribute} from '../../../../../meta/page/meta-page-service/meta-page.service';
import {FormContext} from '../../../../data-edit/form-service/form.service';
import {Observable, of, switchMap} from 'rxjs';
import {DataService} from '../../../../data-service/data.service';
import {TypeaheadService} from '../many-to-one-control/typeahead.service';
import {MetaAttribute, MetaEntity} from '../../../../../domain/meta.entity';

/**
 * Takes an array of entities and displays them as a command separated list of hyperlinks on the page. It needs to know
 * the attribute to display and the "route+id" of how to create the link from the metadata.
 *
 * Will display as inline and comma +1 space separated initially but potentially could be configured to display in other
 * ways like a bullet list.
 *
 * Not editable. Display only.
 */
@Component({
    selector: 'lib-link-list-control',
    templateUrl: './link-list-control.component.html',
    styleUrls: ['./link-list-control.component.css'],
    standalone: false
})
export class LinkListControlComponent implements OnInit {

  @Input()
  mode: string | null;

  @Input()
  cell: CellAttribute;

  @Input()
  formGroup: UntypedFormGroup;

  @Input()
  ctx: FormContext;

  metaAttribute: MetaAttribute | undefined | null = null;
  modelMetaEntity: MetaEntity | undefined | null = null;
  linkMetaEntity: MetaEntity | undefined | null = null;
  linkAttribute: MetaAttribute | undefined | null = null;


  modelList: any[] = [];
  entityList$: Observable<any[]>;

  constructor(protected readonly dataService: DataService, protected readonly typeaheadService: TypeaheadService) { }

  ngOnInit(): void {
    // TECHNICAL DEBT: wasn't sure how to turn this into metadata. Will solve this problem when we need to use this link-list a second time
    const linkAttributeName = 'project';

    this.metaAttribute = this.cell.attribute;
    if(this.metaAttribute && this.metaAttribute.relationshipTarget) {
      this.modelMetaEntity = this.ctx.metaEntityMap.get(this.metaAttribute.relationshipTarget);
      console.log('modelMetaEntity:', this.modelMetaEntity);

      if(this.modelMetaEntity) {
        this.linkAttribute = this.modelMetaEntity.attributes.find(s => s.name === linkAttributeName);
        console.log('linkAttribute:', this.linkAttribute);
        if(this.linkAttribute) {
          this.linkMetaEntity = this.ctx.metaEntityMap.get(this.linkAttribute.relationshipTarget);
          console.log('linkMetaEntity:', this.linkMetaEntity);
        }
      }
    }

    this.modelList = this.getModelList();
    this.entityList$ = this.getEntityList();
  }

  getEntityList(): Observable<any[]> {

    if(this.metaAttribute && this.modelMetaEntity && this.linkMetaEntity && this.linkAttribute) {
      const linkAttributeName = this.linkAttribute.name + "_id";
      const modelList = this.modelList;
      const idList = modelList.map( (s: any) =>  {
        return s[linkAttributeName];
      });
      console.log('idList:', idList);

      return this.typeaheadService.searchByIdList(idList, this.modelMetaEntity, this.linkAttribute).pipe(switchMap((itemList) => {
        return of(itemList);
      }));
    }
    else {
      return of([]);
    }
  }

  getModelList(): any[] {
    let list: any[] = [];
    if(this.cell && this.cell.attribute && this.cell.attribute.name) {
      const formControl = this.formGroup.get(this.cell.attribute.name);
      if(formControl && formControl.value) {
        list = formControl.value as [];
      }
    }
    return list;
  }

}
