import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { EnumerationOptionsControlComponent } from './enumeration-options-control.component';
import { CellAttribute } from '../../../../../meta/page/meta-page-service/meta-page.service';

describe('EnumerationOptionsControlComponent', () => {
  let component: EnumerationOptionsControlComponent;
  let fixture: ComponentFixture<EnumerationOptionsControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [EnumerationOptionsControlComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EnumerationOptionsControlComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should parse pipe-delimited string in writeValue', () => {
    component.writeValue('Option A | Option B | Option C');
    expect(component.optionsList).toEqual(['Option A', 'Option B', 'Option C']);
  });

  it('should add option and emit pipe-separated string', () => {
    let emitted = '';
    component.registerOnChange((val: string) => {
      emitted = val;
    });

    component.optionsList = ['Option A'];
    component.newOptionText = 'Option B';
    component.addOption();

    expect(component.optionsList).toEqual(['Option A', 'Option B']);
    expect(emitted).toBe('Option A | Option B');
  });

  it('should remove option and emit updated string', () => {
    let emitted = '';
    component.registerOnChange((val: string) => {
      emitted = val;
    });

    component.optionsList = ['Option A', 'Option B', 'Option C'];
    component.removeOption(1);

    expect(component.optionsList).toEqual(['Option A', 'Option C']);
    expect(emitted).toBe('Option A | Option C');
  });

  it('should move option earlier and later', () => {
    let emitted = '';
    component.registerOnChange((val: string) => {
      emitted = val;
    });

    component.optionsList = ['A', 'B', 'C'];
    component.moveOption(1, -1);
    expect(component.optionsList).toEqual(['B', 'A', 'C']);
    expect(emitted).toBe('B | A | C');

    component.moveOption(0, 1);
    expect(component.optionsList).toEqual(['A', 'B', 'C']);
    expect(emitted).toBe('A | B | C');
  });
});
