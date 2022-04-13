import { Component, OnInit } from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

/**
 * This is a simple message dialog, you can use this to pop-up a message in a Modal dialog so that the user must
 * acknowledge the dialog before proceeding with some task.
 *
 * This could evolve into something more than just an "Ok" message/response.
 */
@Component({
  selector: 'lib-message-dialog',
  templateUrl: './message-dialog.component.html',
  styleUrls: ['./message-dialog.component.css']
})
export class MessageDialogComponent implements OnInit {

  title = 'Message Title goes here';
  text = 'Message not defined.';

  constructor(public activeModal: NgbActiveModal) { }

  ngOnInit(): void {
  }

}
