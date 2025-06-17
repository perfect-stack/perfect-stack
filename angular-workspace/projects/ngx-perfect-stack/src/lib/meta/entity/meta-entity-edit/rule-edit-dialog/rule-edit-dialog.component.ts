import { Component, OnInit } from '@angular/core';
import {RuleType} from '../../../../domain/meta.rule';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {FormGroup} from '@angular/forms';

@Component({
    selector: 'lib-rule-edit-dialog',
    templateUrl: './rule-edit-dialog.component.html',
    styleUrls: ['./rule-edit-dialog.component.css'],
    standalone: false
})
export class RuleEditDialogComponent implements OnInit {

  ruleDataFormGroup: FormGroup;

  constructor(public readonly activeModal: NgbActiveModal) { }

  ngOnInit(): void {
  }

  onCancel() {
    this.activeModal.dismiss();
  }

  onUpdate() {
    this.activeModal.close();
  }

  isUpdateEnabled() {
    return true;
  }

  getRuleTypeOptions() {
    return Object.keys(RuleType);
  }

  onSelectRuleType(ruleType: RuleType) {
    console.log(`Rule type selected`, ruleType);
  }
}
