import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PipeListControlComponent } from './pipe-list-control.component';
import { CellAttribute } from '../../../../../meta/page/meta-page-service/meta-page.service';

describe('PipeListControlComponent', () => {
  let component: PipeListControlComponent;
  let fixture: ComponentFixture<PipeListControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PipeListControlComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PipeListControlComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize options from cell.attribute.enumeration', () => {
    component.cell = {
      attribute: {
        name: 'target_taxa',
        type: 'Enumeration',
        enumeration: ['Animalia', 'Fungi', 'Plantae'],
      },
    } as unknown as CellAttribute;

    component.initOptions();
    expect(component.predefinedOptions).toEqual(['Animalia', 'Fungi', 'Plantae']);
  });

  it('should parse pipe-delimited string in writeValue', () => {
    component.writeValue('Animalia|Plantae');
    expect(component.selectedValues).toEqual(['Animalia', 'Plantae']);
  });

  it('should parse pipe-delimited string with spaces in writeValue', () => {
    component.writeValue('Animalia | Plantae');
    expect(component.selectedValues).toEqual(['Animalia', 'Plantae']);
  });

  it('should compute availableOptions excluding selected ones case-insensitively', () => {
    component.predefinedOptions = ['Animalia', 'Fungi', 'Plantae'];
    component.selectedValues = ['Plantae'];
    expect(component.availableOptions).toEqual(['Animalia', 'Fungi']);
  });

  it('should add value and emit pipe-separated string', () => {
    let emitted = '';
    component.registerOnChange((val: string) => {
      emitted = val;
    });

    component.predefinedOptions = ['Animalia', 'Fungi', 'Plantae'];
    component.selectedValues = ['Plantae'];
    component.addValue('Animalia');

    expect(component.selectedValues).toEqual(['Plantae', 'Animalia']);
    expect(emitted).toBe('Plantae|Animalia');
  });

  it('should remove value and emit updated string', () => {
    let emitted = '';
    component.registerOnChange((val: string) => {
      emitted = val;
    });

    component.selectedValues = ['Plantae', 'Animalia'];
    component.removeValue(0);

    expect(component.selectedValues).toEqual(['Animalia']);
    expect(emitted).toBe('Animalia');
  });
});
