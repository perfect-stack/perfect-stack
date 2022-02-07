import {Component, EventEmitter, HostListener, Input, OnInit, Output} from '@angular/core';
import {Menu, MenuItem} from '../../../../domain/meta.menu';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {FormBuilder} from '@angular/forms';


export class MenuItemAddEvent {
  menuItem: MenuItem;
  position: number;
}

@Component({
  selector: 'app-menu-item-view',
  templateUrl: './menu-item-view.component.html',
  styleUrls: ['./menu-item-view.component.css']
})
export class MenuItemViewComponent implements OnInit {

  @Input()
  public menu: Menu | null;

  @Input()
  public menuItem: MenuItem | null;

  @Output()
  public menuItemAdded = new EventEmitter<MenuItemAddEvent>();

  public mouseActive = false;

  menuItemForm = this.fb.group({
    label: [''],
    route: [''],
  });

  constructor(
    protected readonly fb: FormBuilder,
    protected readonly modalService: NgbModal) { }

  ngOnInit(): void {
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
      const nextItem = new MenuItem();
      nextItem.label = 'Label';
      nextItem.route = '/route/here';

      this.menu.items.push(nextItem);
    }
  }

  @HostListener('mouseenter')
  mouseenter() {
    console.log("OMG It's a Mouse!!!");
    this.mouseActive = true;
  }

  @HostListener('mouseleave')
  mouseleave() {
    console.log("OMG It's a Mouse!!!");
    this.mouseActive = false;
  }

  onDelete() {

  }
}
