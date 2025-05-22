import {Injectable} from "@angular/core";
import {MetaAttribute, MetaEntity} from "../../domain/meta.entity";
import {DataService} from "./data.service";
import {forkJoin, map, Observable, of, shareReplay, switchMap} from "rxjs";
import {MetaEntityService} from "../../meta/entity/meta-entity-service/meta-entity.service";


export interface DiscriminatorMapping {
  discriminatorId: string;
  discriminatorValue: string;
  metaEntityName: string;
  metaPageName: string;
}


@Injectable({
  providedIn: 'root'
})
export class DiscriminatorService {

  private discriminatorMapCache$: Observable<Map<string, Map<string, DiscriminatorMapping>>>;


  constructor(protected readonly dataService: DataService,
              protected readonly metaEntityService: MetaEntityService) {}

  get discriminatorMap$() {
    if(!this.discriminatorMapCache$) {
      this.discriminatorMapCache$ = this.requestDiscriminatorMap().pipe(shareReplay(1));
    }
    return this.discriminatorMapCache$;
  }

  private requestDiscriminatorMap(): Observable<Map<string, Map<string, DiscriminatorMapping>>> {
    return this.metaEntityService.metaEntityMap$.pipe(
      switchMap(metaEntityMap => {
        const tasksToResolve: { attributeName: string, observable: Observable<Map<string, DiscriminatorMapping>> }[] = [];

        // Collect all discriminator mapping tasks
        for (const nextMetaEntity of metaEntityMap.values()) {
          for (const nextAttribute of nextMetaEntity.attributes) {
            if (nextAttribute.discriminator) {
              tasksToResolve.push({
                attributeName: nextAttribute.name,
                observable: this.findDiscriminatorMap(nextAttribute)
              });
            }
          }
        }

        // If there are no attributes with discriminators, return an empty map
        if (tasksToResolve.length === 0) {
          return of(new Map<string, Map<string, DiscriminatorMapping>>());
        }

        // Prepare an object for forkJoin: keys are attribute names, values are their observables
        const observablesToJoin: { [key: string]: Observable<Map<string, DiscriminatorMapping>> } = {};
        tasksToResolve.forEach(task => {
          observablesToJoin[task.attributeName] = task.observable;
        });

        // forkJoin will wait for all observables to complete
        return forkJoin(observablesToJoin).pipe(
          map(resolvedResults => {
            // resolvedResults is an object where keys are attributeName and values are the resolved Maps
            const finalDiscriminatorMap = new Map<string, Map<string, DiscriminatorMapping>>();
            for (const attributeName in resolvedResults) {
              if (resolvedResults.hasOwnProperty(attributeName)) {
                finalDiscriminatorMap.set(attributeName, resolvedResults[attributeName]);
              }
            }
            return finalDiscriminatorMap;
          })
        );
      })
    );
  }

  findDiscriminatorMap(attribute: MetaAttribute): Observable<Map<string, DiscriminatorMapping>> {
    const discriminator = attribute.discriminator;
    if(discriminator && discriminator.discriminatorType) {

      return this.dataService.findAll(attribute.discriminator.discriminatorType, '', 1, 1000).pipe(
        map(response => {

          const discriminatorMap = new Map<string, DiscriminatorMapping>();
          const entityResultList: any[] = response.resultList;
          if(entityResultList) {
            console.log('$$$ entityMappingList', discriminator.entityMappingList);
            console.log('$$$ entityResultList', entityResultList);
            discriminator.entityMappingList.forEach(entityMapping => {

              // find the entity that has the same name as the entityMapping
              const entity = entityResultList.find(entity => entity['name'] === entityMapping.discriminatorValue);
              if (entity) {
                const discriminatorMapping: DiscriminatorMapping = {
                  discriminatorId: entity.id,
                  discriminatorValue: entityMapping.discriminatorValue,
                  metaEntityName: entityMapping.metaEntityName,
                  metaPageName: entityMapping.metaEntityName + '.view_edit'
                };

                // Double-link the two different ways of doing lookups because we need both the "id" and the "value" way of doing it
                discriminatorMap.set(entity.id, discriminatorMapping);
                discriminatorMap.set(entityMapping.discriminatorValue, discriminatorMapping);

              }
              else {
                throw new Error(`Unable to find entity in result list with name ${entityMapping.discriminatorValue}`);
              }

            });
          }
          else {
            throw new Error(`Unable to find entity collection from database with name ${attribute.discriminator.discriminatorType}`);
          }

          console.log(`$$$ discriminatorMap:`, discriminatorMap)
          return discriminatorMap;
        }));
    }
    else {
      throw new Error(`Discriminator is not set on attribute ${attribute.name}`);
    }
  }
}
