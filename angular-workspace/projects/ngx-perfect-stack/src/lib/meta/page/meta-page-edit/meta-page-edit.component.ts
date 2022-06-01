import {Component, OnInit} from '@angular/core';
import {Observable, of, switchMap, tap} from 'rxjs';
import {DataQuery, LayoutStyle, MetaPage, PageType, Template, TemplateType} from '../../../domain/meta.page';
import {ActivatedRoute, Router} from '@angular/router';
import {MetaPageService} from '../meta-page-service/meta-page.service';
import {FormControl, FormGroup} from '@angular/forms';
import {MetaEntityService} from '../../entity/meta-entity-service/meta-entity.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {MessageDialogComponent} from '../../../utils/message-dialog/message-dialog.component';
import {TemplateLocationType} from '../../../domain/meta.page';

@Component({
  selector: 'app-meta-page-edit',
  templateUrl: './meta-page-edit.component.html',
  styleUrls: ['./meta-page-edit.component.css']
})
export class MetaPageEditComponent implements OnInit {

  metaPageName: string | null;
  metaPage$: Observable<MetaPage>;

  dataQueryList: DataQuery[];
  templates: Template[];

  metaPageForm = new FormGroup({
    name: new FormControl(''),
    title: new FormControl(''),
    type: new FormControl(''),
    layoutStyle: new FormControl(''),
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
        this.templates = metaPage.templates;
        this.dataQueryList = metaPage.dataQueryList ? metaPage.dataQueryList : [];
        this.metaPageForm.patchValue(metaPage);
      }));
    }));
  }

  newMetaPage() {
    return of(new MetaPage());
  }

  loadMetaPage() {
    return this.metaPageService.findById(this.metaPageName);
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
    metaPage.templates = this.templates;
    metaPage.dataQueryList = this.dataQueryList;

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
