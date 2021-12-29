import {Component, OnInit, ViewChild} from '@angular/core';
import {Observable, switchMap, tap} from 'rxjs';
import {MetaPage, Template} from '../../../domain/meta.page';
import {ActivatedRoute} from '@angular/router';
import {MetaPageService} from '../meta-page-service/meta-page.service';
import {TemplateEditComponent} from '../../../template/template-edit/template-edit.component';

@Component({
  selector: 'app-meta-page-edit',
  templateUrl: './meta-page-edit.component.html',
  styleUrls: ['./meta-page-edit.component.css']
})
export class MetaPageEditComponent implements OnInit {

  metaPageName: string | null;
  metaPage$: Observable<MetaPage>;

  template: Template;

  @ViewChild(TemplateEditComponent)
  templateEditComponent: TemplateEditComponent;

  constructor(protected readonly route: ActivatedRoute,
              protected readonly metaPageService: MetaPageService) { }

  ngOnInit(): void {
    this.metaPage$ = this.route.paramMap.pipe(switchMap(params => {
      this.metaPageName = params.get('metaName');
      if(!this.metaPageName) {
        this.metaPageName = 'Person.edit'
      }

      return this.metaPageService.findById(this.metaPageName).pipe(tap(metaPage => {
        this.template = metaPage.template;
      }));
    }));
  }

  onAddRow(number: number) {
    this.templateEditComponent.onAddRow(number);
  }

  onCancel() {

  }

  onSave(metaPage: MetaPage) {
    console.log(`onSave():`);
    if(metaPage) {
      this.metaPageService.update(metaPage).subscribe(() => {
        console.log('MetaPage saved.');
      });
    }
  }

}
