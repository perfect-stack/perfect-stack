import { Injectable } from '@angular/core';
import {MetaEntity} from '../../domain/meta.entity';

@Injectable({
  providedIn: 'root'
})
export class DataCacheService {

  protected cacheMap = new Map<string, CacheItem>();

  constructor() { }

  get(metaEntity: MetaEntity, key: string): any | null {
    let cacheItem = this.cacheMap.get(key);
    if(cacheItem) {
      if(cacheItem.expiry > Date.now()) {
        return cacheItem.value;
      }
      else {
        this.cacheMap.delete(key);
        return null;
      }
    }
    else {
      return null;
    }
  }

  set(metaEntity: MetaEntity, key: string, value: any) {
    if(metaEntity.cacheExpiryInSecs > 0) {
      let cacheItem = {
        key: key,
        expiry: Date.now() + (metaEntity.cacheExpiryInSecs * 1000),
        value: value
      };

      this.cacheMap.set(key, cacheItem);
    }
    // else no expiry period so don't add to the cache
  }
}

class CacheItem {
  key: string;
  expiry: number;
  value: any;
}
