import {Component, Injectable, OnInit} from '@angular/core';
import {Observable, switchMap, tap} from 'rxjs';
import {MetaAttribute, MetaEntity} from '../../domain/meta.entity';
import {Entity} from '../../domain/entity';
import {ActivatedRoute, Router} from '@angular/router';
import {DataService} from '../data-service/data.service';
import {AbstractControl, FormControl, FormGroup} from '@angular/forms';
import {NgbDateAdapter, NgbDateStruct} from '@ng-bootstrap/ng-bootstrap';
import {MetaEntityService} from '../../meta/entity/meta-entity-service/meta-entity.service';
import {MetaPageService} from '../../meta/page/meta-page-service/meta-page.service';
import {Cell, MetaPage, Template} from '../../domain/meta.page';

// Try not to make this exported out of this class
class CellAttribute {
  width: string;
  height: string;
  attributeName?: string;
  attribute?: MetaAttribute;
}

@Component({
  selector: 'app-data-edit',
  templateUrl: './data-edit.component.html',
  styleUrls: ['./data-edit.component.css']
})
export class DataEditComponent implements OnInit {

  public metaName: string | null;
  public mode: string | null;

  public metaPage$: Observable<MetaPage>;
  public metaEntity$: Observable<MetaEntity>;

  public template: Template;
  public cells: CellAttribute[][] = [];

  public entityId: string | null;
  public entity$: Observable<Entity>;

  entityForm: FormGroup;

  constructor(protected readonly route: ActivatedRoute,
              protected readonly router: Router,
              protected readonly metaEntityService: MetaEntityService,
              protected readonly metaPageService: MetaPageService,
              protected readonly dataService: DataService) {
  }

  ngOnInit(): void {
    this.metaPage$ = this.route.paramMap.pipe(switchMap(params => {
      this.metaName = params.get('metaName');
      this.mode = params.get('mode');

      const metaPageName = `${this.metaName}.${this.mode}`;

      return this.metaPageService.findById(metaPageName).pipe(tap(metaPage => {

        this.metaEntity$ = this.metaEntityService.findById(this.metaName).pipe(tap(metaEntity => {
          this.template = metaPage.template;
          this.cells = [];
          if(this.template && this.template.cells) {
            for(const nextRow of this.template.cells) {
              const cellAttributeRow = []
              for(const nextCell of nextRow) {
                cellAttributeRow.push(this.toCellAttribute(nextCell, metaEntity));
              }
              this.cells.push(cellAttributeRow);
            }
          }

          const controls: {
            [key: string]: AbstractControl;
          } = {};

          // loop through cells and add FormControls for Cell attributes
          for(const nextRow of this.template.cells) {
            for(const nextCell of nextRow) {
              if(nextCell.attributeName) {
                controls[nextCell.attributeName] = new FormControl('');
              }
            }
          }

          this.entityForm = new FormGroup(controls);

          this.entity$ = this.route.paramMap.pipe(switchMap(params => {
            const metaName = params.get('metaName')
            this.entityId = params.get('id');
            return this.dataService.findById(metaName, this.entityId).pipe(tap(entity => {
              this.entityForm.patchValue(entity);
            }));
          }));
        }));
      }));
    }));
  }

  private toCellAttribute(cell: Cell, metaEntity: MetaEntity) {

    const cellAttribute: CellAttribute = {
      ...cell,
    }

    const attribute = metaEntity.attributes.find(a => cell.attributeName == a.name);
    if(attribute) {
      cellAttribute.attribute = attribute;
    }

    return cellAttribute;
  }

  getCSS(cell: Cell): string[] {
    return [
      `col-${cell.width}`
    ];
  }

  onSubmit() {
    switch (this.mode) {
      case 'view':
        this.onEdit();
        break;
      case 'edit':
        this.onSave()
        break;
      default:
        throw new Error(`Unknown mode of ${this.mode}`);
    }
  }

  onBack() {
    this.router.navigate([`/data/${this.metaName}/search`]);
  }

  onEdit() {
    this.router.navigate([`/data/${this.metaName}/edit`, this.entityId]);
  }

  onCancel() {
    this.router.navigate([`/data/${this.metaName}/view`, this.entityId]);
  }

  onSave() {
    const entityData = this.entityForm.value;

    // TODO: we are going to need to think about hidden attributes not bound to the form, otherwise they are not
    // going to survive the round trip from the database.
    entityData.id = this.entityId;

    this.dataService.update(this.metaName, entityData).subscribe(() => {
      this.onCancel();
    });
  }
}


/**
 * This Service handles how the date is represented in scripts i.e. ngModel.
 */
@Injectable()
export class CustomAdapter extends NgbDateAdapter<string> {

  readonly DELIMITER = '-';

  fromModel(value: string | null): NgbDateStruct | null {
    if (value) {
      let date = value.split(this.DELIMITER);
      return {
        year : parseInt(date[0], 10),
        month : parseInt(date[1], 10),
        day : parseInt(date[2], 10),
      };
    }
    return null;
  }

  toModel(date: NgbDateStruct | null): string | null {
    return date ? date.year + this.DELIMITER + date.month + this.DELIMITER + date.day : null;
  }
}
