import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {PaginateTool} from '../../../../../domain/meta.page';
import {FormContext} from '../../../../data-edit/form-service/form.service';
import {EventService} from '../../../../../event/event.service';
import {PropertySheetService} from '../../../../../template/property-sheet/property-sheet.service';
import {Subscription} from 'rxjs';

@Component({
  selector: 'lib-paginate-tool',
  templateUrl: './paginate-tool.component.html',
  styleUrls: ['./paginate-tool.component.css']
})
export class PaginateToolComponent implements OnInit, OnDestroy {

  @Input()
  paginateTool: PaginateTool;

  @Input()
  ctx: FormContext;

  @Input()
  editorMode = false;

  pageNumber = 1;
  pageSize = 50;
  collectionSize = 1;

  criteriaFormSubscription: Subscription;

  constructor(protected readonly eventService: EventService,
              protected readonly propertySheetService: PropertySheetService) { }

  ngOnInit(): void {
    if(this.editorMode) {
      this.pageNumber = 1;
      this.pageSize = 50;
      this.collectionSize = 101;
    }
    else {
      const criteriaForm = this.ctx.formMap.get(this.paginateTool.criteriaForm);
      if(criteriaForm) {

        // listen for future changes
        this.criteriaFormSubscription = criteriaForm.valueChanges.subscribe((nextValue) => {
          this.updatePagination(nextValue);
        });

        // pump the first value through
        this.updatePagination(criteriaForm.value);
      }
    }
  }

  updatePagination(criteriaFormValue: any) {
    this.pageNumber = criteriaFormValue.pageNumber;
    this.pageSize = criteriaFormValue.pageSize;
    this.collectionSize = criteriaFormValue.collectionSize;
  }


  onPaginate(ctx: FormContext) {
    console.log(`Paginate to page: ${this.pageNumber}`)

    if(this.paginateTool.criteriaForm) {
      const criteriaForm = ctx.formMap.get(this.paginateTool.criteriaForm);
      if(criteriaForm) {
        criteriaForm.get('pageNumber')?.setValue(this.pageNumber);
      }
    }
    this.eventService.dispatchOnAction(ctx.metaPage.name, this.paginateTool.channel,  ctx, 'search');
  }

  doEditorAction() {
    // trigger the PropertySheetService to start editing it
    this.propertySheetService.edit('Paginate', this.paginateTool);
  }

  ngOnDestroy(): void {
    if(this.criteriaFormSubscription) {
      this.criteriaFormSubscription.unsubscribe();
    }
  }
}
