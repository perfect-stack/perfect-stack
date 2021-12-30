import {Component, Input, OnInit} from '@angular/core';
import {Template} from '../../domain/meta.page';

@Component({
  selector: 'app-template-table-editor',
  templateUrl: './template-table-editor.component.html',
  styleUrls: ['./template-table-editor.component.css']
})
export class TemplateTableEditorComponent implements OnInit {

  @Input()
  template: Template;

  constructor() { }

  ngOnInit(): void {
  }

}
