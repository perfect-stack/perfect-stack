import {Component, OnInit} from '@angular/core';
import {Observable, of, switchMap, tap} from 'rxjs';
import {MetaPage, PageType, Template} from '../../../domain/meta.page';
import {ActivatedRoute} from '@angular/router';
import {MetaPageService} from '../meta-page-service/meta-page.service';
import {FormControl, FormGroup} from '@angular/forms';

@Component({
  selector: 'app-meta-page-edit',
  templateUrl: './meta-page-edit.component.html',
  styleUrls: ['./meta-page-edit.component.css']
})
export class MetaPageEditComponent implements OnInit {

  metaPageName: string | null;
  metaPage$: Observable<MetaPage>;

  templates: Template[];

  metaPageForm = new FormGroup({
    name: new FormControl(''),
    type: new FormControl(''),
  });

  constructor(protected readonly route: ActivatedRoute,
              protected readonly metaPageService: MetaPageService) { }

  ngOnInit(): void {
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
    this.templates.push(template);
  }

  onCancel() {

  }

  onSave() {
    const metaPage = this.metaPageForm.value;
    metaPage.templates = this.templates;

    console.log('onSave()', metaPage);

    if(this.metaPageName === '**NEW**') {
      this.metaPageService.create(metaPage).subscribe(() => {
        console.log('MetaPage created.');
      })
    }
    else {
      this.metaPageService.update(metaPage).subscribe(() => {
        console.log('MetaPage updated.');
      });
    }
  }

  onSubmit() {

  }

  getPageTypeOptions() {
    return Object.keys(PageType);
  }
}