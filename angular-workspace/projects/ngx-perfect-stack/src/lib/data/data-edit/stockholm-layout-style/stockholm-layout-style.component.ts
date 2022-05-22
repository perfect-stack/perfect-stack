import {Component, Input, OnInit} from '@angular/core';
import {FormContext} from '../form-service/form.service';

@Component({
  selector: 'lib-stockholm-layout-style',
  templateUrl: './stockholm-layout-style.component.html',
  styleUrls: ['./stockholm-layout-style.component.css']
})
export class StockholmLayoutStyleComponent implements OnInit {

  @Input()
  ctx: FormContext;

  constructor() { }

  ngOnInit(): void {
    this.dumpDataMap();
  }

  dumpDataMap() {
    console.log('DumpDataMap: ', this.ctx.dataMap);
  }

}
