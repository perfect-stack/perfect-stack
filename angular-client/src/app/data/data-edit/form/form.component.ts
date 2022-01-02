import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {MetaEntity} from '../../../domain/meta.entity';
import {Template} from '../../../domain/meta.page';
import {CellAttribute, MetaPageService} from '../../../meta/page/meta-page-service/meta-page.service';
import {AbstractControl, FormControl, FormGroup} from '@angular/forms';
import {Observable, tap} from 'rxjs';
import {MetaEntityService} from '../../../meta/entity/meta-entity-service/meta-entity.service';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.css']
})
export class FormComponent implements OnInit, OnChanges {

  @Input()
  mode: string | null;

  @Input()
  template: Template;

  metaEntity$: Observable<MetaEntity>;
  cells: CellAttribute[][];

  entityForm: FormGroup;

  @Output()
  entityFormEvent = new EventEmitter<FormGroup>();

  constructor(protected readonly metaPageService: MetaPageService,
              protected readonly metaEntityService: MetaEntityService) { }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    const mode = changes['mode'].currentValue as string;
    const template = changes['template'].currentValue as Template;

    if(mode && template) {
      this.metaEntity$ = this.metaEntityService.findById(template.metaEntityName).pipe(tap(metaEntity => {
        this.cells = this.metaPageService.toCellAttributeArray(template, metaEntity);
        this.entityForm = this.createForm(template);
        this.entityFormEvent.next(this.entityForm);
      }));
    }
  }

  createForm(template: Template) {
    const controls: {
      [key: string]: AbstractControl;
    } = {};

    // loop through cells and add FormControls for Cell attributes
    for(const nextRow of template.cells) {
      for(const nextCell of nextRow) {
        if(nextCell.attributeName) {
          controls[nextCell.attributeName] = new FormControl('');
        }
      }
    }

    return new FormGroup(controls);
  }

}
