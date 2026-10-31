import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntypedFormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
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
export class ComponentShowcaseComponent implements OnInit, OnDestroy {

  activeTab: 'playground' | 'docs' | 'gherkin' = 'playground';
  activeItem: ShowcaseItem;

  mode: 'edit' | 'view' = 'edit';
  idSuffix: string | null = null;
  isDisabled = false;

  formGroup: UntypedFormGroup;

  // Live Gherkin source state
  featureContent = '';
  isLiveSourceLinked = false;

  private paramsSub?: Subscription;
  private featureSub?: Subscription;
  private readonly featureCache = new Map<string, string>();

  constructor(
    public registry: ShowcaseRegistryService,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.paramsSub = this.route.params.subscribe(params => {
      const id = params['componentId'];
      const targetItem = (id && this.registry.getItem(id))
        ? this.registry.getItem(id)!
        : this.registry.getItems()[0];

      if (!this.activeItem || this.activeItem.id !== targetItem.id) {
        this.activateComponent(targetItem);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.paramsSub) {
      this.paramsSub.unsubscribe();
    }
    if (this.featureSub) {
      this.featureSub.unsubscribe();
    }
  }

  get control(): FormControlWithAttribute {
    return this.formGroup.controls[this.activeItem.attribute.name] as FormControlWithAttribute;
  }

  get categories(): string[] {
    return this.registry.getCategories();
  }

  setActiveTab(tab: 'playground' | 'docs' | 'gherkin'): void {
    this.activeTab = tab;
    this.cdr.markForCheck();
  }

  selectComponent(id: string): void {
    const item = this.registry.getItem(id) || this.registry.getItems()[0];
    this.activateComponent(item);
    if (this.route.snapshot.params['componentId'] !== id) {
      this.router.navigate(['/showcase', id]);
    }
  }

  private activateComponent(item: ShowcaseItem): void {
    this.activeItem = item;
    this.activeItem.cell.attribute = this.activeItem.attribute;

    this.initForm(item.initialValue);
    this.loadFeatureFile(item.id, item.featurePath, item.fallbackFeature);
    this.cdr.markForCheck();
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

  private loadFeatureFile(componentId: string, featurePath: string, fallback: string): void {
    // 1. Cancel previous in-flight HTTP request
    if (this.featureSub) {
      this.featureSub.unsubscribe();
      this.featureSub = undefined;
    }

    // 2. Check if we already have it cached in-memory
    if (this.featureCache.has(featurePath)) {
      this.featureContent = this.featureCache.get(featurePath)!;
      this.isLiveSourceLinked = true;
      this.cdr.markForCheck();
      return;
    }

    // 3. Immediately set to the known fallback so there is zero flicker from the previous component
    this.featureContent = fallback;
    this.isLiveSourceLinked = false;
    this.cdr.markForCheck();

    // 4. Request the live source from the assets endpoint
    this.featureSub = this.http.get(featurePath, { responseType: 'text' }).subscribe({
      next: (content) => {
        // Discard response if user navigated to another component in the meantime
        if (this.activeItem?.id !== componentId) {
          return;
        }

        // Validate that response is genuine Gherkin and NOT an HTML fallback (e.g. index.html from SPA dev server)
        const trimmed = (content || '').trim();
        const isHtml = trimmed.startsWith('<!doctype') || trimmed.startsWith('<html') || trimmed.includes('<app-root>');
        const isGherkin = trimmed.includes('Feature:');

        if (!isHtml && isGherkin) {
          this.featureContent = content;
          this.isLiveSourceLinked = true;
          this.featureCache.set(featurePath, content);
        } else {
          // If server returned index.html or invalid content, keep the clean fallback specification
          this.featureContent = fallback;
          this.isLiveSourceLinked = false;
        }
        this.cdr.markForCheck();
      },
      error: () => {
        if (this.activeItem?.id === componentId) {
          this.featureContent = fallback;
          this.isLiveSourceLinked = false;
          this.cdr.markForCheck();
        }
      }
    });
  }

  setMode(mode: 'edit' | 'view'): void {
    this.mode = mode;
    this.cdr.markForCheck();
  }

  toggleDisabled(): void {
    this.isDisabled = !this.isDisabled;
    if (this.isDisabled) {
      this.control.disable();
    } else {
      this.control.enable();
    }
    this.cdr.markForCheck();
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
    this.cdr.markForCheck();
  }

  triggerValidationError(): void {
    const validationResult: ValidationResult = {
      name: this.activeItem.attribute.name,
      resultType: ResultType.Error,
      message: 'Attribute required'
    };
    this.control.setErrors(validationResult as any);
    this.control.markAsTouched();
    this.cdr.markForCheck();
  }

  clearErrors(): void {
    this.control.setErrors(null);
    this.cdr.markForCheck();
  }

  setSampleValue(val: any): void {
    this.control.setValue(val);
    this.cdr.markForCheck();
  }

  updateUom(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.activeItem.attribute.unitOfMeasure = input.value;
    this.cdr.markForCheck();
  }

  updateScale(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.activeItem.attribute.scale = input.value;
    if (input.value && Number(input.value) > 0) {
      this.activeItem.attribute.type = AttributeType.Double;
    } else {
      this.activeItem.attribute.type = AttributeType.Text;
    }
    this.cdr.markForCheck();
  }

  updateIdSuffix(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.idSuffix = input.value.trim() ? input.value.trim() : null;
    this.cdr.markForCheck();
  }
}
