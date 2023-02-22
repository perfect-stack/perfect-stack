import { Injectable } from '@angular/core';
import {CompletionResult, PageListener} from '../../../../ngx-perfect-stack/src/lib/event/page-listener';
import {FormContext} from '../../../../ngx-perfect-stack/src/lib/data/data-edit/form-service/form.service';
import {UntypedFormGroup} from '@angular/forms';
import {MetaAttribute} from '../../../../ngx-perfect-stack/src/lib/domain/meta.entity';
import {ParamMap, Router} from '@angular/router';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {AddEventDialogComponent} from './add-event-dialog/add-event-dialog.component';
import {MetaPage, Template, TemplateLocationType} from '../../../../ngx-perfect-stack/src/lib/domain/meta.page';

@Injectable({
  providedIn: 'root'
})
export class BirdViewPageListenerService implements PageListener {

  constructor(private modalService: NgbModal,
              protected readonly router: Router) { }

  onAction(ctx: FormContext, channel: string, action: string): void {
    // TODO: probably need to switch based on the name of the action
    console.log(`GOT action: ${action}`);
    if(action === 'recordEvent') {
      const modalRef = this.modalService.open(AddEventDialogComponent).closed.subscribe((eventType) => {
        console.log(`BirdViewPageListenerService: eventType = ${eventType}`);
        if(ctx.dataMap.get('bird')) {
          const bird = ctx.dataMap.get('bird');
          if(bird) {
            const route = `/data/Event/edit/**NEW**?bird_id=${bird.result.id}&event_type=${eventType}`;
            this.router.navigateByUrl(route);
          }
        }
      });
    }
  }

  onAfterSave(ctx: FormContext): void {
  }

  onBeforeSave(ctx: FormContext): void {
  }

  onManyToOneItemSelected(formGroup: UntypedFormGroup, attribute: MetaAttribute, itemSelected: any): void {
  }

  onPageLoad(ctx: FormContext, params: ParamMap, queryParams: ParamMap): void {
    const birdFormGroup = ctx.formMap.get('bird') as UntypedFormGroup;
    if(birdFormGroup) {
      const birdDataSource = birdFormGroup.controls['data_source'];
      if (birdDataSource && birdDataSource.value === 'SkyRanger') {
        this.hideBirdEditButton(ctx);
      }
    }
  }

  hideBirdEditButton(ctx: FormContext) {
    const birdDetailsTemplate = this.recursiveTemplateSearch(ctx.metaPage, 'Bird details');
    if(birdDetailsTemplate) {
      console.log('FOUND bird details template');
      const editButton = birdDetailsTemplate.locations[TemplateLocationType.BottomLeft] as any;
      if(editButton) {
        console.log('FOUND edit bird button');
        editButton['actionPermit'] = 'NONE';
      }
    }
  }

  recursiveTemplateSearch(metaPage: MetaPage, templateHeading: string): Template | null {
    for(const nextTemplate of metaPage.templates) {
      if(nextTemplate.templateHeading === templateHeading) {
        return nextTemplate;
      }

      for(const nextCellRow of nextTemplate.cells) {
        for(const nextCell of nextCellRow) {
          if(nextCell.template && nextCell.template.templateHeading === templateHeading) {
            return nextCell.template;
          }
        }
      }
    }

    return null;
  }

  onCompletion(ctx: FormContext): string {
    return CompletionResult.Continue;
  }
}
