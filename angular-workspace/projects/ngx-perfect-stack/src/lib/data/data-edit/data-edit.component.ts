import {Component, OnInit} from '@angular/core';
import {Observable, switchMap} from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';
import {DataService} from '../data-service/data.service';
import {FormContext, FormService} from './form-service/form.service';
import * as uuid from 'uuid';
import {AttributeType, MetaEntity} from '../../domain/meta.entity';


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

  constructor(protected readonly route: ActivatedRoute,
              protected readonly router: Router,
              protected readonly formService: FormService,
              protected readonly dataService: DataService) {
  }

  ngOnInit(): void {
    this.ctx$ = this.route.paramMap.pipe(switchMap(params => {
      this.metaName = params.get('metaName');
      this.mode = params.get('mode');
      this.entityId = this.toUuid(params.get('id'));

      if(this.metaName && this.mode) {
        return this.formService.loadFormContext(this.metaName, this.mode, this.entityId);
      }
      else {
        throw new Error('Invalid input parameters; ');
      }
    }));
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

  onSave(ctx: FormContext) {
    const entityData = ctx.entityForm.value;
    //const entityData = this.convertFormValue(ctx.metaEntityMap, ctx.metaName, ctx.entityForm.value);

    // TODO: we are going to need to think about hidden attributes not bound to the form, otherwise they are not
    // going to survive the round trip from the database.
    entityData.id = this.entityId;
    console.log(`Form.value converted into: `, entityData);

    if(this.metaName) {
      this.dataService.save(this.metaName, entityData).subscribe(() => {
        this.onCancel();
      });
    }
  }

  private convertFormValue(metaEntityMap: Map<string, MetaEntity>, metaName: string, source: any): any {
    const metaEntity = metaEntityMap.get(metaName);
    if(!metaEntity) {
      throw new Error(`Unable to find metaEntity for metaName ${metaName} in map; ${JSON.stringify(metaEntityMap.keys())}`);
    }

    const target: any = {};
    for(const nextAttribute of metaEntity.attributes) {
      switch (nextAttribute.type) {
        case AttributeType.Identifier:
          target[nextAttribute.name] = this.convertIdentifier(source[nextAttribute.name]);
          break;
        case AttributeType.Text:
        case AttributeType.Html:
        case AttributeType.Date:
          target[nextAttribute.name] = source[nextAttribute.name]
          break;
        case AttributeType.Number:
          throw new Error('TODO - Number');
        case AttributeType.Integer:
          target[nextAttribute.name] = this.convertInteger(source[nextAttribute.name]);
          break;
        case AttributeType.OneToMany:
          target[nextAttribute.name] = this.convertOneToMany(metaEntityMap, nextAttribute.relationshipTarget, source[nextAttribute.name]);
          break;
        case AttributeType.OneToOne:
          target[nextAttribute.name] = this.convertFormValue(metaEntityMap, nextAttribute.relationshipTarget, source[nextAttribute.name]);
          break;
        case AttributeType.ManyToOne:
          target[nextAttribute.name] = source[nextAttribute.name];
          break;
        case AttributeType.OneToPoly:
          throw new Error('TODO - OneToPoly');
        default:
      }
    }

    return target;
  }

  private convertIdentifier(sourceValue: string | null) {
    return sourceValue ? sourceValue : null;
  }

  private convertInteger(sourceValue: string | null) {
    return sourceValue ? Number(sourceValue) : null;
  }

  private convertOneToMany(metaEntityMap: Map<string, MetaEntity>, metaName: string, source: any[]) {
    const target: any = [];

    for(const nextChild of source) {
      target.push(this.convertFormValue(metaEntityMap, metaName, nextChild));
    }

    return target;
  }

}

