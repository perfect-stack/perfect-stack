import {Component, Input, OnInit} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {MetaEntityService} from '../meta-entity-service/meta-entity.service';

@Component({
  selector: 'app-attribute-delete-dialog',
  templateUrl: './attribute-delete-dialog.component.html',
  styleUrls: ['./attribute-delete-dialog.component.css']
})
export class AttributeDeleteDialogComponent implements OnInit {

  @Input()
  metaName: string;

  @Input()
  attributeName: string;

  deleteAttribute = true;
  deleteDatabaseCol = false;

  constructor(public readonly activeModal: NgbActiveModal,
              protected readonly metaEntityService: MetaEntityService ) { }

  ngOnInit(): void {
  }

  onCancel() {
    this.activeModal.close('Close click');
  }

  isDeleteEnabled() {
    return this.deleteAttribute || this.deleteDatabaseCol;
  }

  onDelete() {
    console.log(`Delete attribute ${this.deleteAttribute} and databaseCol ${this.deleteDatabaseCol}`);
    this.metaEntityService.deleteAttribute(this.metaName, this.attributeName, this.deleteAttribute, this.deleteDatabaseCol).subscribe(() => {
      this.onCancel();
    });
  }
}
