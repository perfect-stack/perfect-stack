import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
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

  onAdd(relativeIdx: number) {
    if(this.menu && this.menuItem) {
      const currentIdx = this.findIndex(this.menuItem, this.menu);
      if(currentIdx > -1) {
        const nextItem = new MenuItem();
        nextItem.label = 'Label';
        nextItem.route = '/route/here';
        const nextIdx = currentIdx + relativeIdx;
        //this.menu?.items.splice(nextIdx, 0, nextItem);
        //console.log(`Added item at position: ${nextIdx}`);
        this.menuItemAdded.next({
          menuItem: nextItem,
          position: nextIdx,
        })
      }
    }
  }

  private findIndex(menuItem: MenuItem, menu: Menu): number {
    return menu?.items.findIndex((m) => {
      return m.label === menuItem?.label && m.route === menuItem.route;
    });
  }

  onDelete() {

  }
}
