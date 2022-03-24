import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxPerfectStackComponent } from './ngx-perfect-stack.component';

describe('NgxPerfectStackComponent', () => {
  let component: NgxPerfectStackComponent;
  let fixture: ComponentFixture<NgxPerfectStackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NgxPerfectStackComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NgxPerfectStackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
