import {Component, OnInit} from '@angular/core';
import {Observable, of, switchMap, tap} from 'rxjs';
import {MetaPage, PageType, Template, TemplateType} from '../../../domain/meta.page';
import {ActivatedRoute, Router} from '@angular/router';
import {MetaPageService} from '../meta-page-service/meta-page.service';
import {FormControl, FormGroup} from '@angular/forms';
import {MetaEntity} from '../../../domain/meta.entity';
import {MetaEntityService} from '../../entity/meta-entity-service/meta-entity.service';

@Component({
  selector: 'app-meta-page-edit',
  templateUrl: './meta-page-edit.component.html',
  styleUrls: ['./meta-page-edit.component.css']
})
export class MetaPageEditComponent implements OnInit {

  metaPageName: string | null;
  metaPage$: Observable<MetaPage>;

  public metaEntityOptions$: Observable<MetaEntity[]>;

  templates: Template[];

  metaPageForm = new FormGroup({
    name: new FormControl(''),
    title: new FormControl(''),
    type: new FormControl(''),
  });

  constructor(protected readonly route: ActivatedRoute,
              protected readonly router: Router,
              protected readonly metaEntityService: MetaEntityService,
              protected readonly metaPageService: MetaPageService) { }

  ngOnInit(): void {
    this.metaEntityOptions$ = this.metaEntityService.findAll();

    this.metaPage$ = this.route.paramMap.pipe(switchMap(params => {
      this.metaPageName = params.get('metaPageName');
      const obs = this.metaPageName === '**NEW**' ? this.newMetaPage() : this.loadMetaPage();
      return obs.pipe(tap(metaPage => {
        this.templates = metaPage.templates;
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

  onSubmit() {

  }

  getPageTypeOptions() {
    return Object.keys(PageType);
  }

}
