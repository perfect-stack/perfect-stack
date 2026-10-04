import {Component, EventEmitter, HostListener, Input, OnInit, Output} from '@angular/core';
import {Menu, MenuItem, OpenIn} from '../../../../domain/meta.menu';
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

  @Input()
  public disabled = false;

  @Output()
  public menuItemAdded = new EventEmitter<MenuItem>();

  @Output()
  public menuItemDeleted = new EventEmitter<MenuItem>();

  @Output()
  menuItemMoved = new EventEmitter<number>();

  @Output()
  menuItemMenuMoved = new EventEmitter<number>();

  @Output()
  public menuItemEdited = new EventEmitter<MenuItem | null>();

  mouseActive = false;

  openInOptions = Object.values(OpenIn);

  menuItemForm = this.fb.group({
    label: [''],
    route: [''],
    openIn: [OpenIn.Current],
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

  isOpenDifferentToCurrent(): boolean {
    return !!this.menuItem && !!this.menuItem.openIn && this.menuItem.openIn !== OpenIn.Current;
  }

  getOpenInIcon(): string {
    if (this.menuItem?.openIn === OpenIn.NewWindow) {
      return 'new_window';
    }
    if (this.menuItem?.openIn === OpenIn.NewTab) {
      return 'open_in_new';
    }
    return '';
  }

  getOpenInTooltip(): string {
    if (this.menuItem?.openIn === OpenIn.NewWindow) {
      return 'Opens in a new window';
    }
    if (this.menuItem?.openIn === OpenIn.NewTab) {
      return 'Opens in a new tab';
    }
    return '';
  }

  onEditMenuItem(content: any) {
    if(this.menuItem) {
      this.menuItemForm.patchValue({
        label: this.menuItem.label,
        route: this.menuItem.route,
        openIn: this.menuItem.openIn || OpenIn.Current,
      });
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
      menuItem.openIn = OpenIn.Current;
      this.menuItemAdded.next(menuItem);
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
    modal.close('Save click');
    const menuItem = this.menuItem;
    if(menuItem) {
      const editedItem = this.menuItemForm.value;
      console.log(`Edited item: ${JSON.stringify(editedItem)}`);
      Object.assign(menuItem, editedItem);
      if (!menuItem.openIn) {
        menuItem.openIn = OpenIn.Current;
      }
      this.menuItemEdited.emit(menuItem);
    }
  }
}
