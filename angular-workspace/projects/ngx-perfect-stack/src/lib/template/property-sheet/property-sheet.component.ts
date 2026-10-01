import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {PropertyEditEvent, PropertySheetService, PropertyType} from './property-sheet.service';
import {Observable, shareReplay, Subscription} from 'rxjs';
import {MetaEntityService} from '../../meta/entity/meta-entity-service/meta-entity.service';
import {MetaEntity} from '../../domain/meta.entity';
import {MetaPageService} from '../../meta/page/meta-page-service/meta-page.service';
import {MetaPage} from '../../domain/meta.page';

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
              protected readonly metaPageService: MetaPageService,
              protected readonly changeDetectorRef: ChangeDetectorRef) {
    this.editEventSubscription = this.propertySheetService.editEvent$.subscribe((editEvent: PropertyEditEvent) => {
      this.editEvent = editEvent;
      this.changeDetectorRef.markForCheck();
    });

    this.metaEntityOptions$ = this.metaEntityService.findAll().pipe(shareReplay(1));
    this.metaPageOptions$ = this.metaPageService.findAll().pipe(shareReplay(1));
  }

  ngOnInit(): void {
  }

  get PropertyType() {
    return PropertyType;
  }

  ngOnDestroy(): void {
    if(this.editEventSubscription) {
      this.editEventSubscription.unsubscribe();
    }
  }

  getOptions(options: any) {
    return Object.keys(options);
  }

  getMetaEntity(property: any, metaEntityOptions: MetaEntity[]) {
    return metaEntityOptions.find(me => me.name === this.editEvent.source[property.name]);
  }

  onEntityChange(property: any, $event: any) {
    this.editEvent.source[property.name] = $event.name;
  }

  getMetaPage(property: any, metaPageOptions: MetaPage[]) {
    return metaPageOptions.find(mp => mp.name === this.editEvent.source[property.name]);
  }

  onMetaPageChange(property: any, $event: any) {
    this.editEvent.source[property.name] = $event.name;
  }
}
