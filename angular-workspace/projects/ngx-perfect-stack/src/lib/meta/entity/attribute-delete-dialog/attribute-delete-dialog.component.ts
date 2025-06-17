import {Component, Input, OnInit} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {MetaEntityService} from '../meta-entity-service/meta-entity.service';
import {AttributeType, MetaAttribute} from '../../../domain/meta.entity';

@Component({
    selector: 'app-attribute-delete-dialog',
    templateUrl: './attribute-delete-dialog.component.html',
    styleUrls: ['./attribute-delete-dialog.component.css'],
    standalone: false
})
export class AttributeDeleteDialogComponent implements OnInit {

  @Input()
  metaName: string;

  @Input()
  attribute: MetaAttribute;

  deleteAttribute = true;
  deleteDatabaseCol = false;

  databaseColDeleteDisabled = false;
  databaseColDeleteReason: string;

  constructor(public readonly activeModal: NgbActiveModal,
              protected readonly metaEntityService: MetaEntityService ) { }

  ngOnInit(): void {
    const disableDeleteDatabaseColumn = (this.attribute.type === AttributeType.OneToMany) || (this.attribute.type === AttributeType.OneToPoly);
    if(disableDeleteDatabaseColumn) {
      this.databaseColDeleteDisabled = true;
      this.databaseColDeleteReason = `disabled: ${this.attribute.type}`;
    }
  }

  onCancel() {
    this.activeModal.close('Close click');
  }

  isDeleteEnabled() {
    return this.deleteAttribute || this.deleteDatabaseCol;
  }

  onDelete() {
    console.log(`Delete attribute ${this.deleteAttribute} and databaseCol ${this.deleteDatabaseCol}`);
    this.metaEntityService.deleteAttribute(this.metaName, this.attribute.name, this.deleteAttribute, this.deleteDatabaseCol).subscribe(() => {
      this.onCancel();
    });
  }
}
