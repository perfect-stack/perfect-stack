import {Component, OnDestroy, OnInit} from '@angular/core';
import {PropertyEditEvent, PropertySheetService, PropertyType} from './property-sheet.service';
import {Observable, Subscription} from 'rxjs';
import {MetaEntityService} from '../../meta/entity/meta-entity-service/meta-entity.service';
import {MetaEntity} from '../../domain/meta.entity';
import {Template} from '../../domain/meta.page';

@Component({
  selector: 'lib-property-sheet',
  templateUrl: './property-sheet.component.html',
  styleUrls: ['./property-sheet.component.css']
})
export class PropertySheetComponent implements OnInit, OnDestroy {

  editEvent : PropertyEditEvent;

  editEventSubscription: Subscription;

  metaEntityOptions$: Observable<MetaEntity[]>;

  constructor(protected readonly propertySheetService: PropertySheetService,
              protected readonly metaEntityService: MetaEntityService) {
    this.editEventSubscription = this.propertySheetService.editEvent$.subscribe((editEvent: PropertyEditEvent) => {
      this.editEvent = editEvent;
    });

    this.metaEntityOptions$ = this.metaEntityService.findAll();
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    if(this.editEventSubscription) {
      this.editEventSubscription.unsubscribe();
    }
  }

  getOptions(options: any): any[] {
    if(Array.isArray(options)) {
      return options;
    }
    else {
      return Object.keys(options);
    }
  }

  getMetaEntity(template: Template, metaEntityOptions: MetaEntity[]) {
    return metaEntityOptions.find(me => me.name === template.metaEntityName);
  }

  onEntityChange(metaEntity: MetaEntity) {
    // todo this can be written more generically
    this.editEvent.source.metaEntityName = metaEntity.name;
  }

  get PropertyType() {
    return PropertyType;
  }
}
