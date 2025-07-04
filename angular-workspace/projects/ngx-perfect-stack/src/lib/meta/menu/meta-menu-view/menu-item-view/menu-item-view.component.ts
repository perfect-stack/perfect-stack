import {Component, EventEmitter, HostListener, Input, OnInit, Output} from '@angular/core';
import {Menu, MenuItem} from '../../../../domain/meta.menu';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {UntypedFormBuilder} from '@angular/forms';



@Component({
    selector: 'lib-menu-item-view',
    templateUrl: './menu-item-view.component.html',
    styleUrls: ['./menu-item-view.component.css'],
    standalone: false
})
export class MenuItemViewComponent implements OnInit {

  @Input()
  public menu: Menu | null;

  @Input()
  public menuItem: MenuItem | null;

  @Output()
  public menuItemAdded = new EventEmitter<MenuItem>();

  @Output()
  public menuItemDeleted = new EventEmitter<MenuItem>();

  @Output()
  menuItemMoved = new EventEmitter<number>();

  @Output()
  menuItemMenuMoved = new EventEmitter<number>();

  mouseActive = false;

  menuItemForm = this.fb.group({
    label: [''],
    route: [''],
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

  onEditMenuItem(content: any) {
    if(this.menuItem) {
      this.menuItemForm.patchValue(this.menuItem);
      this.modalService.open(content, {ariaLabelledBy: 'modal-basic-title'}).result.then((result) => {
        console.log(`closed: ${result}`);
      }, (reason) => {
        console.log(`dismissed: ${reason}`);
      });
    }
  }

  onAdd() {
    if(this.menu && this.menuItem) {
      const menuItem = new MenuItem();
      menuItem.label = 'Label';
      menuItem.route = '/route/here';
      this.menuItemAdded.next(menuItem)
    }
  }

  onMove(direction: number) {
    this.menuItemMoved.next(direction);
  }

  onMenuMoved(direction: number) {
    this.menuItemMenuMoved.next(direction);
  }

  onDelete() {
    if(this.menuItem) {
      this.menuItemDeleted.next(this.menuItem);
    }
  }

  onSave(modal: any) {
    modal.close('Save click')
    if(this.menuItem) {
      const editedItem = this.menuItemForm.value;
      console.log(`Edited item: ${JSON.stringify(editedItem)}`);
      this.menuItem = Object.assign(this.menuItem, editedItem);
    }
  }
}
