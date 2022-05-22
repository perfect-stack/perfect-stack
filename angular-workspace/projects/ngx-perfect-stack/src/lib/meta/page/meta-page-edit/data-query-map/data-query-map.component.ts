import {Component, Input, OnInit} from '@angular/core';
import {DataQuery, QueryType, ResultCardinalityType} from '../../../../domain/meta.page';
import {FormGroup} from '@angular/forms';

@Component({
  selector: 'lib-data-query-map',
  templateUrl: './data-query-map.component.html',
  styleUrls: ['./data-query-map.component.css']
})
export class DataQueryMapComponent implements OnInit {

  @Input()
  dataQueryList: DataQuery[];

  constructor() { }

  ngOnInit(): void {
  }

  onAddDataQuery() {
    this.dataQueryList.push(new DataQuery());
  }

  getResultCardinalityOptions() {
    return Object.keys(ResultCardinalityType);
  }

  getQueryTypeOptions() {
    return Object.keys(QueryType);
  }

  onDelete(i: number) {
    this.dataQueryList?.splice(i, 1);
  }
}
