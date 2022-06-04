import {Component, OnInit} from '@angular/core';
import {Observable, withLatestFrom} from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';
import {DataService} from '../data-service/data.service';
import {FormContext, FormService} from './form-service/form.service';
import * as uuid from 'uuid';
import {AttributeType} from '../../domain/meta.entity';
import {IdentifierVisitor, IntegerVisitor, MetaEntityTreeWalker} from '../../utils/tree-walker/meta-entity-tree-walker';
import {DebugService} from '../../utils/debug/debug.service';


@Component({
  selector: 'app-data-edit',
  templateUrl: './data-edit.component.html',
  styleUrls: ['./data-edit.component.css']
})
export class DataEditComponent implements OnInit {

  public metaName: string | null;
  public mode: string | null;
  public entityId: string | null;

  ctx$: Observable<FormContext>;

  constructor(public readonly debugService: DebugService,
              protected readonly route: ActivatedRoute,
              protected readonly router: Router,
              protected readonly formService: FormService,
              protected readonly dataService: DataService) {
  }

  ngOnInit(): void {
    this.route.url.pipe(
      withLatestFrom(this.route.paramMap, this.route.queryParamMap)
    ).subscribe(([url, paramMap,  queryParamMap]) => {

      this.metaName = paramMap.get('metaName');
      this.mode = paramMap.get('mode');
      this.entityId = this.toUuid(paramMap.get('id'));

      console.log('queryParamMap', queryParamMap.keys);

      if(this.metaName && this.mode) {
        this.ctx$ = this.formService.loadFormContext(this.metaName, this.mode, this.entityId);
      }
      else {
        throw new Error('Invalid input parameters; ');
      }
    });
  }

  toUuid(value: string | null) {
    if(value === null || value === '**NEW**') {
      return null;
    }
    else {
      // will throw error if invalid, caller should bail out of use case
      uuid.parse(value);
      return value;
    }
  }

  onBack() {
    this.router.navigate([`/data/${this.metaName}/search`]);
  }

  onEdit() {
    this.router.navigate([`/data/${this.metaName}/edit`, this.entityId]);
  }

  onCancel() {
    if(this.entityId) {
      this.router.navigate([`/data/${this.metaName}/view`, this.entityId]);
    }
    else {
      this.router.navigate([`/data/${this.metaName}/search`]);
    }
  }

  getDataForm(ctx: FormContext) {
    // TODO: so that entityForm could be removed from FOrmContext we are going to use a rule that says an edit page
    // only has one form and so we can get the one and only form out of the formMap. Once this changes to some sort
    // of template approach then the template binding will be needed here to find the form to get the entityData
    return ctx.formMap.values().next().value;
  }


  onSave(ctx: FormContext) {

    // TODO: this is wrong since it now depends on entityForm
    //const entityData = ctx.entityForm.value;

    // TODO: so that entityForm could be removed from FOrmContext we are going to use a rule that says an edit page
    // only has one form and so we can get the one and only form out of the formMap. Once this changes to some sort
    // of template approach then the template binding will be needed here to find the form to get the entityData
    const entityData = this.getDataForm(ctx).value;
    console.log(`DataEdit: form value:`, entityData);

    const treeWalker = new MetaEntityTreeWalker(ctx.metaEntityMap);
    treeWalker.byType(AttributeType.Integer, new IntegerVisitor());
    treeWalker.byType(AttributeType.Identifier, new IdentifierVisitor());
    treeWalker.walk(entityData, ctx.metaEntity);
    console.log(`DataEdit: save value:`, entityData);

    if(this.metaName) {
      this.dataService.save(this.metaName, entityData).subscribe(() => {
        this.onCancel();
      });
    }
  }

}

