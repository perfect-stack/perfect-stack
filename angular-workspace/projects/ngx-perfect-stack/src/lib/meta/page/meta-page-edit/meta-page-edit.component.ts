import {Component, OnDestroy, OnInit} from '@angular/core';
import {Observable, of, Subscription, switchMap, tap} from 'rxjs';
import {
  Controller,
  DataQuery,
  LayoutStyle,
  MetaPage,
  PageType,
  Template,
  TemplateType
} from '../../../domain/meta.page';
import {ActivatedRoute, Router} from '@angular/router';
import {MetaPageService} from '../meta-page-service/meta-page.service';
import {UntypedFormControl, UntypedFormGroup} from '@angular/forms';
import {MetaEntityService} from '../../entity/meta-entity-service/meta-entity.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {MessageDialogComponent} from '../../../utils/message-dialog/message-dialog.component';
import {TemplateLocationType} from '../../../domain/meta.page';

@Component({
    selector: 'app-meta-page-edit',
    templateUrl: './meta-page-edit.component.html',
    styleUrls: ['./meta-page-edit.component.css'],
    standalone: false
})
export class MetaPageEditComponent implements OnInit, OnDestroy {

  activeTab = 'template';

  metaPageName: string | null;
  metaPage$: Observable<MetaPage>;

  dataQueryList: DataQuery[];
  templates: Template[];
  controllers: Controller[];

  private formChangesSub?: Subscription;

  metaPageForm = new UntypedFormGroup({
    name: new UntypedFormControl(''),
    title: new UntypedFormControl(''),
    type: new UntypedFormControl(''),
    layoutStyle: new UntypedFormControl(''),
  });

  constructor(protected readonly route: ActivatedRoute,
              protected readonly router: Router,
              protected modalService: NgbModal,
              protected readonly metaEntityService: MetaEntityService,
              protected readonly metaPageService: MetaPageService) { }

  ngOnInit(): void {
    this.metaPage$ = this.route.paramMap.pipe(switchMap(params => {
      this.metaPageName = params.get('metaPageName');
      const obs = this.metaPageName === '**NEW**' ? this.newMetaPage() : this.loadMetaPage();
      return obs.pipe(tap(metaPage => {
        this.dataQueryList = metaPage.dataQueryList ? metaPage.dataQueryList : [];
        this.controllers = metaPage.controllers ? metaPage.controllers : [];
        this.templates = metaPage.templates;
        this.metaPageForm.patchValue(metaPage);
        this.metaPageService.currentMetaPage$.next(metaPage);

        this.formChangesSub?.unsubscribe();
        this.formChangesSub = this.metaPageForm.valueChanges.subscribe(val => {
          Object.assign(metaPage, val);
          this.metaPageService.currentMetaPage$.next(metaPage);
        });
      }));
    }));
  }

  newMetaPage() {
    return of(new MetaPage());
  }

  loadMetaPage() {
    return this.metaPageService.findById(this.metaPageName);
  }

  ngOnDestroy(): void {
    this.formChangesSub?.unsubscribe();
    this.metaPageService.currentMetaPage$.next(null);
  }

  onAddTemplate() {
    console.log(`Add Template`);
    const template = new Template();
    template.metaEntityName = 'Person';
    template.type = TemplateType.form;
    this.templates.push(template);
  }

  onCancel() {
    this.router.navigate(['/meta/page/search']);
  }

  onSave() {
    const metaPage = this.metaPageForm.value;
    metaPage.dataQueryList = this.dataQueryList;
    metaPage.controllers = this.controllers;
    metaPage.templates = this.templates;

    console.log('onSave()', metaPage);

    if(this.metaPageName === '**NEW**') {
      this.metaPageService.create(metaPage).subscribe(() => {
        console.log('MetaPage created.');
        this.onCancel();
      });
    }
    else {
      this.metaPageService.update(metaPage).subscribe(() => {
        console.log('MetaPage updated.');
        this.onCancel();
      });
    }
  }

  onDelete(metaPage: MetaPage) {
    console.log(`Delete metaPage: ${metaPage.name}`);
    const modalRef = this.modalService.open(MessageDialogComponent)
    const modalComponent: MessageDialogComponent = modalRef.componentInstance;
    modalComponent.title = 'Delete Meta Page Confirmation';
    modalComponent.text = `This action will delete the Meta Page ${metaPage.name}. It cannot be undone.`;
    modalComponent.actions = [
      {name: 'Cancel', style: 'btn btn-outline-primary'},
      {name: 'Delete', style: 'btn btn-danger'},
    ];

    modalRef.closed.subscribe((closedResult) => {
      console.log(`Message Dialog closedResult = ${closedResult}`);
      if(closedResult === 'Delete') {
        this.metaPageService.delete(metaPage).subscribe(() => {
          this.onCancel();
        });
      }
    });
  }

  getPageTypeOptions() {
    return Object.keys(PageType);
  }

  getLayoutStyleOptions() {
    return Object.keys(LayoutStyle);
  }

  get TemplateLocationType() {
    return TemplateLocationType;
  }

}
