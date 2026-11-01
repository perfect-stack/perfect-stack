import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntypedFormArray, UntypedFormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { ShowcaseRegistryService } from './showcase-registry.service';
import { ShowcaseItem } from './showcase.model';
import { FormContext, FormControlWithAttribute } from '../data/data-edit/form-service/form.service';
import { ResultType, ValidationResult } from '../domain/meta.rule';
import { AttributeType, EntityType, MetaEntity, VisibilityType } from '../domain/meta.entity';
import { LayoutStyle, PageType, ToolType } from '../domain/meta.page';

@Component({
  selector: 'lib-component-showcase',
  templateUrl: './component-showcase.component.html',
  styleUrls: ['./component-showcase.component.scss'],
  standalone: false
})
export class ComponentShowcaseComponent implements OnInit, OnDestroy {

  activeTab: 'playground' | 'docs' | 'gherkin' = 'playground';
  secondaryTab: 'docs' | 'gherkin' = 'docs';
  layoutMode: 'auto' | 'tabs' | 'split' | 'panoramic' = 'auto';
  windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;

  activeItem: ShowcaseItem;

  mode: 'edit' | 'view' = 'edit';
  idSuffix: string | null = null;
  isDisabled = false;

  formGroup: UntypedFormGroup;
  ctx: FormContext;

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
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem('showcase_layout_mode') as any;
        if (saved && ['auto', 'tabs', 'split', 'panoramic'].includes(saved)) {
          this.layoutMode = saved;
        }
      } catch (e) {
        // ignore storage errors
      }
    }

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

  get control(): any {
    const attrName = this.activeItem?.attribute?.name;
    if (!attrName || !this.formGroup) {
      return this.formGroup;
    }
    return this.formGroup.controls[attrName + '_id'] ||
           this.formGroup.controls[attrName] ||
           this.formGroup;
  }

  get categories(): string[] {
    return this.registry.getCategories();
  }

  get effectiveLayout(): 'tabs' | 'split' | 'panoramic' {
    if (this.layoutMode !== 'auto') {
      return this.layoutMode;
    }
    if (this.windowWidth >= 2200) {
      return 'panoramic';
    } else if (this.windowWidth >= 1500) {
      return 'split';
    } else {
      return 'tabs';
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    if (typeof window !== 'undefined') {
      this.windowWidth = window.innerWidth;
      this.cdr.markForCheck();
    }
  }

  setLayoutMode(mode: 'auto' | 'tabs' | 'split' | 'panoramic'): void {
    this.layoutMode = mode;
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('showcase_layout_mode', mode);
      } catch (e) {
        // ignore
      }
    }
    this.cdr.markForCheck();
  }

  setActiveTab(tab: 'playground' | 'docs' | 'gherkin'): void {
    this.activeTab = tab;
    this.cdr.markForCheck();
  }

  setSecondaryTab(tab: 'docs' | 'gherkin'): void {
    this.secondaryTab = tab;
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
    if (this.activeItem.attribute) {
      this.activeItem.cell.attribute = this.activeItem.attribute;
    }
    if (!this.activeItem.cell.metaEntity) {
      this.activeItem.cell.metaEntity = {
        name: 'ShowcaseEntity',
        pluralName: 'ShowcaseEntities',
        attributes: item.attribute ? [item.attribute] : []
      } as any;
    }

    this.initForm(item.initialValue);

    const dataMap = new Map<string, any>();
    dataMap.set('event', { result: { easting: '175.0', northing: '-41.0', location: 'Lower Hutt' } });
    dataMap.set('pet', { result: { id: 'a21fdd11-d6db-4155-ac59-d8ad80ddd31e', name: 'Fido', first_name: 'Fido' } });
    dataMap.set('results', {
      result: [
        { id: '1', name: 'Lower Hutt Clinic', easting: '174.9', northing: '-41.2', location: 'Lower Hutt' },
        { id: '2', name: 'Wellington Central Clinic', easting: '174.77', northing: '-41.28', location: 'Wellington Central' },
        { id: '3', name: 'Auckland Clinic', easting: '174.76', northing: '-36.85', location: 'Auckland' }
      ]
    });

    const formMap = new Map<string, any>();
    formMap.set('root', this.formGroup);

    const criteriaForm = new UntypedFormGroup({
      pageNumber: new FormControlWithAttribute(1),
      pageSize: new FormControlWithAttribute(10),
      collectionSize: new FormControlWithAttribute(50),
    });
    formMap.set('criteria', criteriaForm);

    const petMediaFileEntity: MetaEntity = {
      name: 'PetMediaFile',
      pluralName: 'PetMediaFiles',
      type: EntityType.Database,
      icon: 'photo',
      rootNode: false,
      treeNode: false,
      timestamps: true,
      cacheExpiryInSecs: 0,
      permanentDelete: false,
      attributes: [
        { name: 'id', label: 'ID', type: AttributeType.Identifier, visibility: VisibilityType.Visible } as any,
        { name: 'path', label: 'Path', type: AttributeType.Text, visibility: VisibilityType.Visible } as any,
        { name: 'comments', label: 'Comments', type: AttributeType.Text, visibility: VisibilityType.Visible } as any,
      ]
    };
    const metaEntityMap = new Map<string, MetaEntity>();
    metaEntityMap.set('PetMediaFile', petMediaFileEntity);

    this.ctx = {
      metaName: item.attribute?.name || 'Showcase',
      mode: this.mode,
      id: '1',
      metaPage: {
        name: 'Showcase.page',
        title: 'Showcase Preview',
        type: PageType.view_edit,
        layoutStyle: LayoutStyle.NewYork,
        dataQueryList: [],
        controllers: [],
        templates: []
      } as any,
      metaPageMap: new Map(),
      metaEntityMap: metaEntityMap,
      metaEntity: {
        name: 'ShowcaseEntity',
        pluralName: 'ShowcaseEntities',
        attributes: item.attribute ? [item.attribute] : []
      } as any,
      discriminatorMap: new Map(),
      dataMap: dataMap,
      formMap: formMap,
      paramMap: null,
      queryParamMap: null
    };

    this.loadFeatureFile(item.id, item.featurePath, item.fallbackFeature);
    this.cdr.markForCheck();
  }

  private initForm(initialValue: any): void {
    const attrName = this.activeItem.attribute.name;
    const controls: Record<string, any> = {};

    if (this.activeItem.attribute.type === AttributeType.OneToMany) {
      const formArray = new UntypedFormArray(Array.isArray(initialValue) ? initialValue.map((item: any) => {
        if (item && typeof item === 'object') {
          const itemControls: Record<string, any> = {};
          for (const k of Object.keys(item)) {
            itemControls[k] = new FormControlWithAttribute(item[k]);
          }
          return new UntypedFormGroup(itemControls);
        }
        return new FormControlWithAttribute(item);
      }) : []);
      (formArray as any).attribute = this.activeItem.attribute;
      controls[attrName] = formArray;
    } else if (this.activeItem.attribute.type === AttributeType.OneToOne) {
      const childControls: Record<string, any> = {};
      if (initialValue && typeof initialValue === 'object') {
        for (const k of Object.keys(initialValue)) {
          childControls[k] = new FormControlWithAttribute(initialValue[k]);
        }
      }
      const childGroup = new UntypedFormGroup(childControls);
      (childGroup as any).attribute = this.activeItem.attribute;
      controls[attrName] = childGroup;
    } else if (this.activeItem.attribute.type === AttributeType.OneToPoly) {
      const formArray = new UntypedFormArray([]);
      (formArray as any).attribute = this.activeItem.attribute;
      controls[attrName] = formArray;
    } else {
      const ctrl = new FormControlWithAttribute(initialValue);
      ctrl.attribute = this.activeItem.attribute;
      controls[attrName] = ctrl;
    }

    if (this.activeItem.attribute.type === AttributeType.ManyToOne || attrName.endsWith('_id')) {
      const idCtrl = new FormControlWithAttribute(initialValue?.id || initialValue);
      idCtrl.attribute = this.activeItem.attribute;
      controls[attrName + '_id'] = idCtrl;
    }

    if (this.activeItem.id === 'map-tool') {
      controls['geometry'] = new FormControlWithAttribute('{"type": "Point", "coordinates": [174.9, -41.2]}');
      controls['easting'] = new FormControlWithAttribute('174.9');
      controls['northing'] = new FormControlWithAttribute('-41.2');
    } else if (this.activeItem.id === 'duration-tool') {
      controls['date_time'] = new FormControlWithAttribute('2026-11-01T09:00:00Z');
      controls['end_date_time'] = new FormControlWithAttribute('2026-11-01T17:30:00Z');
    }

    const secondaryName = (this.activeItem.cell?.componentData as any)?.secondaryAttributeName;
    if (secondaryName) {
      const secondaryVal = this.activeItem.initialSecondaryValue ??
        (this.activeItem.id === 'flexible-date-time' ? 'Exact' : 'Standard');
      controls[secondaryName] = new FormControlWithAttribute(secondaryVal);
    }

    this.formGroup = new UntypedFormGroup(controls);
    this.mode = 'edit';
    this.isDisabled = false;
  }

  private loadFeatureFile(componentId: string, featurePath: string, fallback: string): void {
    // 1. Cancel previous in-flight HTTP request
    if (this.featureSub) {
      this.featureSub.unsubscribe();
      this.featureSub = undefined;
    }

    // 2. Check in-memory cache for instantaneous switch
    if (this.featureCache.has(featurePath)) {
      this.featureContent = this.featureCache.get(featurePath)!;
      this.isLiveSourceLinked = true;
      this.cdr.markForCheck();
      return;
    }

    // 3. Immediately set the fallback specification so stale text never lingers
    this.featureContent = fallback;
    this.isLiveSourceLinked = false;
    this.cdr.markForCheck();

    // 4. Fetch the live .feature source file from assets
    this.featureSub = this.http.get(featurePath, { responseType: 'text' }).subscribe({
      next: (content: string) => {
        // Discard response if user already switched to another component
        if (this.activeItem?.id !== componentId) {
          return;
        }

        const isHtml = content.trim().toLowerCase().startsWith('<!doctype html') || content.trim().toLowerCase().startsWith('<html');
        const isGherkin = content.includes('Feature:');

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
    if (this.ctx) {
      this.ctx.mode = mode;
    }
    this.cdr.markForCheck();
  }

  toggleDisabled(): void {
    this.isDisabled = !this.isDisabled;
    if (this.formGroup) {
      if (this.isDisabled) {
        this.formGroup.disable();
      } else {
        this.formGroup.enable();
      }
    }
    this.cdr.markForCheck();
  }

  toggleTouched(): void {
    if (this.control) {
      if (this.control.touched) {
        this.control.markAsPristine();
        this.control.markAsUntouched();
        if ((this.control as any).touchedSignal) {
          (this.control as any).touchedSignal.set(false);
        }
      } else {
        this.control.markAsTouched();
      }
    }
    this.cdr.markForCheck();
  }

  triggerValidationError(): void {
    const validationResult: ValidationResult = {
      name: this.activeItem.attribute.name,
      resultType: ResultType.Error,
      message: 'Attribute required'
    };
    if (this.control && typeof this.control.setErrors === 'function') {
      this.control.setErrors(validationResult as any);
      this.control.markAsTouched();
    }
    const idCtrl = this.formGroup.controls[this.activeItem.attribute.name + '_id'];
    if (idCtrl) {
      idCtrl.setErrors(validationResult as any);
      idCtrl.markAsTouched();
    }
    this.cdr.markForCheck();
  }

  clearErrors(): void {
    if (this.control && typeof this.control.setErrors === 'function') {
      this.control.setErrors(null);
    }
    const idCtrl = this.formGroup.controls[this.activeItem.attribute.name + '_id'];
    if (idCtrl) {
      idCtrl.setErrors(null);
    }
    this.cdr.markForCheck();
  }

  setSampleValue(val: any): void {
    const attrName = this.activeItem.attribute?.name;
    if (this.activeItem.attribute.type === AttributeType.OneToMany && Array.isArray(val)) {
      const formArray = this.formGroup.controls[attrName] as UntypedFormArray;
      if (formArray) {
        formArray.clear();
        for (const item of val) {
          if (item && typeof item === 'object') {
            const itemControls: Record<string, any> = {};
            for (const k of Object.keys(item)) {
              itemControls[k] = new FormControlWithAttribute(item[k]);
            }
            formArray.push(new UntypedFormGroup(itemControls));
          } else {
            formArray.push(new FormControlWithAttribute(item));
          }
        }
      }
    } else if (this.activeItem.attribute.type === AttributeType.OneToOne && val && typeof val === 'object') {
      const childGroup = this.formGroup.controls[attrName] as UntypedFormGroup;
      if (childGroup) {
        childGroup.patchValue(val);
      }
    } else if (this.control && typeof this.control.setValue === 'function') {
      this.control.setValue(val);
      if (attrName) {
        const idCtrl = this.formGroup.controls[attrName + '_id'];
        if (idCtrl) {
          idCtrl.setValue(val?.id || val);
        }
      }
    }

    if (this.activeItem.id === 'paginate-tool') {
      const criteriaForm = this.ctx?.formMap?.get('criteria');
      if (criteriaForm) {
        criteriaForm.get('pageNumber')?.setValue(val);
      }
    } else if (this.activeItem.id === 'map-tool' && typeof val === 'string') {
      if (val.includes('Auckland')) {
        this.formGroup.controls['easting']?.setValue('174.76');
        this.formGroup.controls['northing']?.setValue('-36.85');
      } else if (val.includes('Wellington')) {
        this.formGroup.controls['easting']?.setValue('174.77');
        this.formGroup.controls['northing']?.setValue('-41.28');
      } else {
        this.formGroup.controls['easting']?.setValue('174.9');
        this.formGroup.controls['northing']?.setValue('-41.2');
      }
    }

    if (this.activeItem.cell?.tool) {
      const tool = this.activeItem.cell.tool as any;
      if (tool.type === ToolType.Button && val) {
        tool.action = val;
      } else if (tool.type === ToolType.ButtonGroup && val) {
        tool.label = val;
        tool.action = val;
      } else if (tool.type === ToolType.Link && val) {
        tool.text = val;
      } else if (tool.type === ToolType.PageTitle && val !== undefined) {
        tool.nameAttributes = val;
      } else if (tool.type === ToolType.TextTool && val) {
        tool.text = val;
      } else if (tool.type === ToolType.Icon && val) {
        tool.iconName = val;
      } else if (tool.type === ToolType.Duration && val) {
        this.formGroup.controls['end_date_time']?.setValue(val);
      } else if (tool.type === ToolType.Image && val) {
        tool.imageUrl = val;
      } else if (tool.type === ToolType.LastSignIn && val) {
        tool.username = val;
      } else if (tool.type === ToolType.Tree && val) {
        tool.initialDepth = val;
      }
    }
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
