import {Component, Injector, OnInit} from '@angular/core';
import {Observable, switchMap} from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';
import {MetaAttribute, MetaEntity} from '../../../domain/meta.entity';
import {MetaEntityService} from '../meta-entity-service/meta-entity.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {AttributeDeleteDialogComponent} from '../attribute-delete-dialog/attribute-delete-dialog.component';

@Component({
    selector: 'app-meta-entity-view',
    templateUrl: './meta-entity-view.component.html',
    styleUrls: ['./meta-entity-view.component.css'],
    standalone: false
})
export class MetaEntityViewComponent implements OnInit {

  public metaName: string | null;
  public metaEntity$: Observable<MetaEntity>;

  constructor(protected readonly route: ActivatedRoute,
              protected readonly router: Router,
              protected readonly modalService: NgbModal,
              protected readonly metaEntityService: MetaEntityService) {
  }

  ngOnInit(): void {
    this.metaEntity$ = this.route.paramMap.pipe(switchMap(params => {
      this.metaName = params.get('metaName');
      return this.metaEntityService.findById(this.metaName);
    }));
  }

  onEdit() {
    this.router.navigate(['/meta/entity/edit/', this.metaName]);
  }

  onBack() {
    this.router.navigate(['meta/entity/search']);
  }

  onDelete() {

  }

  onDeleteAttribute(attribute: MetaAttribute) {
    if(this.metaName) {
      const modalRef = this.modalService.open(AttributeDeleteDialogComponent);
      const attributeDeleteDialog = modalRef.componentInstance as AttributeDeleteDialogComponent;
      attributeDeleteDialog.metaName = this.metaName;
      attributeDeleteDialog.attribute = attribute;
      modalRef.closed.subscribe(() => {
        this.metaEntity$ = this.metaEntityService.findById(this.metaName);
      });
    }
  }

  attributeHasRuleData(attribute: MetaAttribute) {
    return attribute.rules && attribute.rules.length > 0;
  }

}
