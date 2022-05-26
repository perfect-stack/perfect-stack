import {EventEmitter, Injectable} from '@angular/core';
import {MetaEntity} from '../../domain/meta.entity';

@Injectable({
  providedIn: 'root'
})
export class AttributePaletteService {

  metaEntity$ = new EventEmitter<MetaEntity>();

  constructor() { }
}
