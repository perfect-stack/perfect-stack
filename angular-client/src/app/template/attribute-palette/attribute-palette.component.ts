import {Component, Input, OnInit} from '@angular/core';
import {MetaEntity} from '../../domain/meta.entity';

@Component({
  selector: 'app-attribute-palette',
  templateUrl: './attribute-palette.component.html',
  styleUrls: ['./attribute-palette.component.css']
})
export class AttributePaletteComponent implements OnInit {

  @Input()
  metaEntity: MetaEntity | undefined;

  constructor() { }

  ngOnInit(): void {
  }

}
