import {Component, OnDestroy, OnInit} from '@angular/core';
import {Property, PropertyEditEvent, PropertySheetService, PropertyType} from './property-sheet.service';
import {Observable, Subscription} from 'rxjs';
import {MetaEntityService} from '../../meta/entity/meta-entity-service/meta-entity.service';
import {MetaEntity} from '../../domain/meta.entity';
import {MetaPage, Template} from '../../domain/meta.page';
import {MetaPageService} from '../../meta/page/meta-page-service/meta-page.service';

@Component({
    selector: 'lib-property-sheet',
    templateUrl: './property-sheet.component.html',
    styleUrls: ['./property-sheet.component.css'],
    standalone: false
})
export class PropertySheetComponent implements OnInit, OnDestroy {

  editEvent : PropertyEditEvent;

  editEventSubscription: Subscription;

  metaEntityOptions$: Observable<MetaEntity[]>;
  metaPageOptions$: Observable<MetaPage[]>;

  constructor(protected readonly propertySheetService: PropertySheetService,
              protected readonly metaEntityService: MetaEntityService,
              protected readonly metaPageService: MetaPageService) {
    this.editEventSubscription = this.propertySheetService.editEvent$.subscribe((editEvent: PropertyEditEvent) => {
      this.editEvent = editEvent;
    });

    this.metaEntityOptions$ = this.metaEntityService.findAll();
    this.metaPageOptions$ = this.metaPageService.findAll();
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

  getMetaEntity(property: Property, metaEntityOptions: MetaEntity[]) {
    const propertyValue = this.editEvent.source[property.name];
    return metaEntityOptions.find(me => me.name === propertyValue);
  }

  getMetaPage(property: Property, metaPageOptions: MetaPage[]) {
    const propertyValue = this.editEvent.source[property.name];
    return metaPageOptions.find(mp => mp.name === propertyValue);
  }

  onEntityChange(property: Property, metaEntity: MetaEntity) {
    // todo this can be written more generically
    //this.editEvent.source.metaEntityName = metaEntity.name;
    this.editEvent.source[property.name] = metaEntity.name;
  }

  onMetaPageChange(property: Property, metaPage: MetaPage) {
    //this.editEvent.source.metaPageName = metaPage.name;
    this.editEvent.source[property.name] = metaPage.name;
  }

  /*metaPageComparator(p1: any, p2: any) {
    const name1 = p1 && p1.name ? p1.name : p1;
    const name2 = p2 && p2.name ? p2.name : p2;
    if(name1 && name2) {
      return name1 === name2;
    }
    else {
      return name1 === null && name2 === null;
    }
  }*/

  get PropertyType() {
    return PropertyType;
  }
}
