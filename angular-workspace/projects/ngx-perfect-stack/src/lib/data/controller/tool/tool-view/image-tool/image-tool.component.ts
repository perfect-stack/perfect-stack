import {Component, Input, OnInit} from '@angular/core';
import {ImageTool} from '../../../../../domain/meta.page';

@Component({
  selector: 'lib-image-tool',
  templateUrl: './image-tool.component.html',
  styleUrls: ['./image-tool.component.css']
})
export class ImageToolComponent implements OnInit {

  @Input()
  imageTool: ImageTool;

  constructor() { }

  ngOnInit(): void {
  }

}
