import {Component, OnInit} from '@angular/core';
import {AttributePaletteService} from './attribute-palette.service';

@Component({
    selector: 'lib-attribute-palette',
    templateUrl: './attribute-palette.component.html',
    styleUrls: ['./attribute-palette.component.css'],
    standalone: false
})
export class AttributePaletteComponent implements OnInit {

  metaEntity$ = this.attributePaletteService.metaEntity$;

  constructor(protected readonly attributePaletteService: AttributePaletteService) { }

  ngOnInit(): void {
  }

}
