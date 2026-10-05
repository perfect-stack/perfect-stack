import {
  Component,
  ComponentRef,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  Type,
  ViewContainerRef
} from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { Template } from '../../../../domain/meta.page';
import { MetaEntity } from '../../../../domain/meta.entity';
import { FormContext } from '../../../data-edit/form-service/form.service';
import { LAYOUT_COMPONENT } from './layout.token';

export { LAYOUT_COMPONENT } from './layout.token';

@Component({
  selector: 'lib-layout-outlet',
  template: '',
  styles: [':host { display: contents; }'],
  standalone: false
})
export class LayoutOutletComponent implements OnInit, OnChanges, OnDestroy {

  @Input()
  mode: string | null = null;

  @Input()
  template: Template | null = null;

  @Input()
  formGroup: UntypedFormGroup | null = null;

  @Input()
  relationshipProperty: string | null = null;

  @Input()
  metaEntity: MetaEntity | null = null;

  @Input()
  ctx: FormContext | null = null;

  @Input()
  showTemplateHeadings = true;

  private componentRef: ComponentRef<any> | null = null;

  constructor(
    @Inject(LAYOUT_COMPONENT) private readonly layoutComponentType: Type<any>,
    private readonly vcr: ViewContainerRef,
  ) {}

  ngOnInit(): void {
    if (!this.componentRef) {
      this.render();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['template'] || !this.componentRef) {
      this.render();
    } else {
      this.updateInputs();
    }
  }

  ngOnDestroy(): void {
    if (this.componentRef) {
      this.componentRef.destroy();
      this.componentRef = null;
    }
  }

  private render(): void {
    this.vcr.clear();
    if (!this.template) {
      this.componentRef = null;
      return;
    }

    this.componentRef = this.vcr.createComponent(this.layoutComponentType);
    this.updateInputs();
  }

  private updateInputs(): void {
    if (!this.componentRef) {
      return;
    }

    this.componentRef.setInput('mode', this.mode);
    this.componentRef.setInput('template', this.template);
    this.componentRef.setInput('formGroup', this.formGroup);
    this.componentRef.setInput('relationshipProperty', this.relationshipProperty);
    this.componentRef.setInput('metaEntity', this.metaEntity);
    this.componentRef.setInput('ctx', this.ctx);
    this.componentRef.setInput('showTemplateHeadings', this.showTemplateHeadings);
    this.componentRef.changeDetectorRef.markForCheck();
  }
}
