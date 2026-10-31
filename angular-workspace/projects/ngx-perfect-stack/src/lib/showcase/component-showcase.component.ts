import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntypedFormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ShowcaseRegistryService } from './showcase-registry.service';
import { ShowcaseItem } from './showcase.model';
import { FormControlWithAttribute } from '../data/data-edit/form-service/form.service';
import { ResultType, ValidationResult } from '../domain/meta.rule';
import { AttributeType } from '../domain/meta.entity';

@Component({
  selector: 'lib-component-showcase',
  templateUrl: './component-showcase.component.html',
  styleUrls: ['./component-showcase.component.scss'],
  standalone: false
})
export class ComponentShowcaseComponent implements OnInit {

  activeTab: 'playground' | 'docs' | 'gherkin' = 'playground';
  activeItem: ShowcaseItem;

  mode: 'edit' | 'view' = 'edit';
  idSuffix: string | null = null;
  isDisabled = false;

  formGroup: UntypedFormGroup;

  // Live Gherkin source state
  featureContent = '';
  isLiveSourceLinked = false;

  constructor(
    public registry: ShowcaseRegistryService,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['componentId'];
      const targetItem = (id && this.registry.getItem(id))
        ? this.registry.getItem(id)!
        : this.registry.getItems()[0];

      if (!this.activeItem || this.activeItem.id !== targetItem.id) {
        this.activateComponent(targetItem);
      }
    });
  }

  get control(): FormControlWithAttribute {
    return this.formGroup.controls[this.activeItem.attribute.name] as FormControlWithAttribute;
  }

  get categories(): string[] {
    return this.registry.getCategories();
  }

  selectComponent(id: string): void {
    if (this.route.snapshot.params['componentId'] !== id) {
      this.router.navigate(['/showcase', id]);
    } else {
      const item = this.registry.getItem(id) || this.registry.getItems()[0];
      this.activateComponent(item);
    }
  }

  private activateComponent(item: ShowcaseItem): void {
    this.activeItem = item;
    this.activeItem.cell.attribute = this.activeItem.attribute;

    this.initForm(item.initialValue);
    this.loadFeatureFile(item.featurePath, item.fallbackFeature);
  }

  private initForm(initialValue: any): void {
    const ctrl = new FormControlWithAttribute(initialValue);
    ctrl.attribute = this.activeItem.attribute;
    this.formGroup = new UntypedFormGroup({
      [this.activeItem.attribute.name]: ctrl
    });
    this.mode = 'edit';
    this.isDisabled = false;
  }

  private loadFeatureFile(featurePath: string, fallback: string): void {
    this.http.get(featurePath, { responseType: 'text' }).subscribe({
      next: (content) => {
        this.featureContent = content;
        this.isLiveSourceLinked = true;
      },
      error: () => {
        this.featureContent = fallback;
        this.isLiveSourceLinked = false;
      }
    });
  }

  setMode(mode: 'edit' | 'view'): void {
    this.mode = mode;
  }

  toggleDisabled(): void {
    this.isDisabled = !this.isDisabled;
    if (this.isDisabled) {
      this.control.disable();
    } else {
      this.control.enable();
    }
  }

  toggleTouched(): void {
    if (this.control.touched) {
      this.control.markAsPristine();
      this.control.markAsUntouched();
      if (this.control.touchedSignal) {
        this.control.touchedSignal.set(false);
      }
    } else {
      this.control.markAsTouched();
    }
  }

  triggerValidationError(): void {
    const validationResult: ValidationResult = {
      name: this.activeItem.attribute.name,
      resultType: ResultType.Error,
      message: 'Attribute required'
    };
    this.control.setErrors(validationResult as any);
    this.control.markAsTouched();
  }

  clearErrors(): void {
    this.control.setErrors(null);
  }

  setSampleValue(val: any): void {
    this.control.setValue(val);
  }

  updateUom(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.activeItem.attribute.unitOfMeasure = input.value;
  }

  updateScale(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.activeItem.attribute.scale = input.value;
    if (input.value && Number(input.value) > 0) {
      this.activeItem.attribute.type = AttributeType.Double;
    } else {
      this.activeItem.attribute.type = AttributeType.Text;
    }
  }

  updateIdSuffix(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.idSuffix = input.value.trim() ? input.value.trim() : null;
  }
}
