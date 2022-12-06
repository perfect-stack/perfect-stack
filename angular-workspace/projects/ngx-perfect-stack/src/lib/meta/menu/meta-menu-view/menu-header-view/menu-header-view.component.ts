import {Component, EventEmitter, HostListener, Input, OnInit, Output} from '@angular/core';
import {Menu, MenuItem} from '../../../../domain/meta.menu';
import {FormsModule, ReactiveFormsModule, UntypedFormBuilder} from '@angular/forms';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'lib-menu-header-view',
  templateUrl: './menu-header-view.component.html',
  styleUrls: ['./menu-header-view.component.css']
})
export class MenuHeaderViewComponent implements OnInit {

  @Input()
  public menu: Menu | null;

  @Output()
  menuDeleted = new EventEmitter();

  @Output()
  menuAdded = new EventEmitter();

  @Output()
  menuMoved = new EventEmitter<number>();

  public mouseActive = false;

  menuForm = this.fb.group({
    label: [''],
  });

  constructor(
    protected readonly fb: UntypedFormBuilder,
    protected readonly modalService: NgbModal) { }

  ngOnInit(): void {
  }

  @HostListener('mouseenter')
  mouseenter() {
    // console.log("OMG It's a Mouse!!!");
    this.mouseActive = true;
  }

  @HostListener('mouseleave')
  mouseleave() {
    // console.log("OMG It's a Mouse!!!");
    this.mouseActive = false;
  }

  onAdd() {
    this.menuAdded.next(null);
  }

  onDelete() {
    this.menuDeleted.next(null);
  }

  onMove(direction: number) {
    this.menuMoved.next(direction);
  }

  onEditMenu(content: any) {
    if(this.menu) {
      this.menuForm.patchValue(this.menu);
      this.modalService.open(content, {ariaLabelledBy: 'modal-basic-title'}).result.then((result) => {
        console.log(`closed: ${result}`);
      }, (reason) => {
        console.log(`dismissed: ${reason}`);
      });
    }
  }

  onSave(modal: any) {
    modal.close('Save click')
    if(this.menu) {
      const editedItem = this.menuForm.value;
      this.menu = Object.assign(this.menu, editedItem);
    }
  }
}
