import { Injectable } from '@angular/core';
import {CompletionResult, PageListener} from '../../../../ngx-perfect-stack/src/lib/event/page-listener';
import {FormContext} from '../../../../ngx-perfect-stack/src/lib/data/data-edit/form-service/form.service';
import {UntypedFormGroup} from '@angular/forms';
import {MetaAttribute} from '../../../../ngx-perfect-stack/src/lib/domain/meta.entity';
import {ParamMap, Router} from '@angular/router';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {AddEventDialogComponent} from './add-event-dialog/add-event-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class BirdViewPageListenerService implements PageListener {

  constructor(private modalService: NgbModal,
              protected readonly router: Router) { }

  onAction(ctx: FormContext, action: string): void {
    // TODO: probably need to switch based on the name of the action
    console.log(`GOT action: ${action}`);
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

  onAfterSave(ctx: FormContext): void {
  }

  onBeforeSave(ctx: FormContext): void {
  }

  onManyToOneItemSelected(formGroup: UntypedFormGroup, attribute: MetaAttribute, itemSelected: any): void {
  }

  onPageLoad(ctx: FormContext, params: ParamMap, queryParams: ParamMap): void {
  }

  onCompletion(ctx: FormContext): string {
    return CompletionResult.Continue;
  }
}
