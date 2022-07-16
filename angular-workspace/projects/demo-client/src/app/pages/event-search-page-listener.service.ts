import {Injectable} from '@angular/core';
import {CompletionResult, PageListener} from '../../../../ngx-perfect-stack/src/lib/event/page-listener';
import {FormContext} from '../../../../ngx-perfect-stack/src/lib/data/data-edit/form-service/form.service';
import {UntypedFormGroup} from '@angular/forms';
import {MetaAttribute} from '../../../../ngx-perfect-stack/src/lib/domain/meta.entity';
import {ParamMap, Router} from '@angular/router';
import {AddEventDialogComponent} from './add-event-dialog/add-event-dialog.component';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

@Injectable({
  providedIn: 'root'
})
export class EventSearchPageListenerService implements PageListener {

  constructor(private modalService: NgbModal,
              protected readonly router: Router) { }

  onAction(ctx: FormContext, action: string): void {
    console.log(`EventSearchPageListenerService got action ${action}`);
    const modalRef = this.modalService.open(AddEventDialogComponent).closed.subscribe((eventType) => {
      console.log(`EventSearchPageListenerService: eventType = ${eventType}`);
      const route = `/data/Event/edit/**NEW**?event_type=${eventType}`;
      this.router.navigateByUrl(route);
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
