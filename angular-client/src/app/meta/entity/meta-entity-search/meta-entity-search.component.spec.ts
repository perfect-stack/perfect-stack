import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetaEntitySearchComponent } from './meta-entity-search.component';

describe('MetaEntitySearchComponent', () => {
  let component: MetaEntitySearchComponent;
  let fixture: ComponentFixture<MetaEntitySearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MetaEntitySearchComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MetaEntitySearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
