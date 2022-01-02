import {Component, Injectable, OnInit} from '@angular/core';
import {Observable, switchMap, tap} from 'rxjs';
import {Entity} from '../../domain/entity';
import {ActivatedRoute, Router} from '@angular/router';
import {DataService} from '../data-service/data.service';
import {FormGroup} from '@angular/forms';
import {NgbDateAdapter, NgbDateStruct} from '@ng-bootstrap/ng-bootstrap';
import {MetaPageService} from '../../meta/page/meta-page-service/meta-page.service';
import {MetaPage, Template} from '../../domain/meta.page';


@Component({
  selector: 'app-data-edit',
  templateUrl: './data-edit.component.html',
  styleUrls: ['./data-edit.component.css']
})
export class DataEditComponent implements OnInit {

  public metaName: string | null;
  public mode: string | null;

  public metaPage$: Observable<MetaPage>;
  public template: Template;

  public entityId: string | null;
  public entity$: Observable<Entity>;

  entityForm: FormGroup;

  constructor(protected readonly route: ActivatedRoute,
              protected readonly router: Router,
              protected readonly metaPageService: MetaPageService,
              protected readonly dataService: DataService) {
  }

  ngOnInit(): void {
    this.metaPage$ = this.route.paramMap.pipe(switchMap(params => {
      this.metaName = params.get('metaName');
      this.mode = params.get('mode');
      this.entityId = params.get('id');

      const metaPageName = `${this.metaName}.${this.mode}`;

      return this.metaPageService.findById(metaPageName).pipe(tap(metaPage => {
        if(metaPage.templates && metaPage.templates.length !== 1) {
          throw new Error(`Zero or more than one template supplied to DataEditComponent for ${this.metaName}`);
        }
      }));
    }));

    this.entity$ = this.route.paramMap.pipe(switchMap(params => {
      const metaName = params.get('metaName');
      const entityId = params.get('id');

      return this.dataService.findById(metaName, entityId).pipe(tap(entity => {
        this.entityForm.patchValue(entity);
      }));
    }));
  }

  onEntityFormEvent($event: any): void {
    console.log(`DataEdit: onChanges()`);
    this.entityForm = $event;

    // this.entity$.subscribe(entity => {
    //   console.log('loaded entity, TODO better way of doing this please');
    // })
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
