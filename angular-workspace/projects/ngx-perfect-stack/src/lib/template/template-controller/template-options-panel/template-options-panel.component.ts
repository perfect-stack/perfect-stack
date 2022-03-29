import {Component, Input, OnInit} from '@angular/core';
import {Template} from '../../../domain/meta.page';
import {TemplateOptionsModalComponent} from './template-options-modal/template-options-modal.component';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'lib-template-options-panel',
  templateUrl: './template-options-panel.component.html',
  styleUrls: ['./template-options-panel.component.css']
})
export class TemplateOptionsPanelComponent implements OnInit {

  @Input()
  template: Template;

  constructor(protected readonly modalService: NgbModal) { }

  ngOnInit(): void {
  }

  openTemplateOptions() {
    const modalRef = this.modalService.open(TemplateOptionsModalComponent, {});
    modalRef.componentInstance.assignTemplate(this.template);
  }
}
