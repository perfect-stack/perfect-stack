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
import {ClientConfigService} from '../../../client/config/client-config.service';

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
  public isMetaEditEnabled$: Observable<boolean>;

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
              protected readonly metaPageService: MetaPageService,
              protected readonly clientConfigService: ClientConfigService) { }

  ngOnInit(): void {
    this.isMetaEditEnabled$ = this.clientConfigService.isMetaEditEnabled('Page');
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

  onAddTemplate(type: TemplateType = TemplateType.form, index?: number): void {
    console.log(`Add Template of type: ${type} at index: ${index}`);
    const defaultEntity = this.templates?.find(t => t.metaEntityName)?.metaEntityName
      || this.dataQueryList?.[0]?.metaEntityName
      || 'Person';

    const template = new Template();
    template.metaEntityName = defaultEntity;
    template.type = type;
    template.locations = {};

    switch (type) {
      case TemplateType.table:
        template.templateHeading = `${defaultEntity} Table`;
        template.cells = [
          [
            { width: '12', height: '1' }
          ]
        ];
        template.orderByName = 'UNKNOWN';
        template.orderByDir = 'ASC';
        break;
      case TemplateType.header:
        template.templateHeading = `${defaultEntity} Header`;
        template.cells = [];
        break;
      case TemplateType.form:
      default:
        template.templateHeading = `${defaultEntity} Form`;
        template.cells = [
          [
            { width: '3', height: '1' },
            { width: '3', height: '1' },
            { width: '3', height: '1' },
            { width: '3', height: '1' },
          ],
          [
            { width: '6', height: '1' },
            { width: '6', height: '1' },
          ],
        ];
        break;
    }

    if (index !== undefined && index >= 0 && index <= this.templates.length) {
      this.templates.splice(index, 0, template);
    } else {
      this.templates.push(template);
    }
  }

  onDeleteTemplate(template: Template, index?: number): void {
    const heading = template.templateHeading || `${template.type || 'Template'}`;
    const modalRef = this.modalService.open(MessageDialogComponent);
    const modalComponent: MessageDialogComponent = modalRef.componentInstance;
    modalComponent.title = 'Delete Template Confirmation';
    modalComponent.text = `Are you sure you want to delete the template "${heading}"? It cannot be undone.`;
    modalComponent.actions = [
      {name: 'Cancel', style: 'btn btn-outline-primary'},
      {name: 'Delete', style: 'btn btn-danger'},
    ];

    modalRef.closed.subscribe((closedResult) => {
      console.log(`Message Dialog closedResult = ${closedResult}`);
      if (closedResult === 'Delete') {
        const targetIndex = index !== undefined ? index : this.templates.indexOf(template);
        if (targetIndex >= 0) {
          this.templates.splice(targetIndex, 1);
        }
      }
    });
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
    const modalRef = this.modalService.open(MessageDialogComponent);
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

  get TemplateType() {
    return TemplateType;
  }

}
