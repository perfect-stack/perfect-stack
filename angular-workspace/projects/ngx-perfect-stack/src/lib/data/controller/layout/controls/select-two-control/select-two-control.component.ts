import {ChangeDetectorRef, Component, Input, OnDestroy, OnInit} from '@angular/core';
import {MetaAttribute} from '../../../../../domain/meta.entity';
import {Cell, LabelLayoutType} from '../../../../../domain/meta.page';
import {DataService} from '../../../../data-service/data.service';
import {UntypedFormGroup} from '@angular/forms';
import {CellAttribute} from '../../../../../meta/page/meta-page-service/meta-page.service';
import {Subscription} from 'rxjs';

@Component({
    selector: 'lib-select-two-control',
    templateUrl: './select-two-control.component.html',
    styleUrls: ['./select-two-control.component.css'],
    standalone: false
})
export class SelectTwoControlComponent implements OnInit, OnDestroy {

  // Important: This is needed because we are just a wrapper for the real components and so this component sets the
  // formControlName for those components and not the Cell/template above us.
  @Input()
  formGroup: UntypedFormGroup = new UntypedFormGroup({});

  @Input()
  attribute: MetaAttribute;

  @Input()
  mode: string | null;

  @Input()
  cell: Cell;

  secondaryAttributeName: string;
  secondaryOptions: string[] = [];

  combinedValue: string | null = null;
  currentEntity: any = null;

  private secondarySub?: Subscription;

  constructor(protected readonly dataService: DataService,
              protected readonly cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.secondaryAttributeName = (this.cell.componentData as any)?.secondaryAttributeName;

    const secondaryAttributeControl = this.formGroup?.get(this.secondaryAttributeName);
    if (secondaryAttributeControl) {
      this.secondarySub = secondaryAttributeControl.valueChanges.subscribe(() => {
        this.updateCombinedValue();
      });
    }

    const id = this.formGroup.get(this.attribute.name + '_id')?.value;
    if(id) {
      this.dataService.findById(this.attribute.relationshipTarget, id).subscribe({
        next: (response: any) => {
          this.currentEntity = response;
          // always run the onSelectedEntity() function so that secondaryOptions gets updated
          this.onSelectedEntity(response);
        },
        error: () => {
          this.currentEntity = null;
          this.combinedValue = '—';
          this.cdr.markForCheck();
        }
      });
    }
    else {
      this.combinedValue = '—';
      this.cdr.markForCheck();
    }
  }

  isReadOnly() {
    return this.mode === 'view';
  }

  getCSSClass(css: string) {
    return this.isReadOnly() ? `form-control ${css}` : `form-select ${css}`;
  }

  onSelectedEntity(entity: any) {
    console.log(`onSelectedEntity() entity: `, entity);
    this.currentEntity = entity;
    if(entity && this.secondaryAttributeName) {
      let secondaryValues: string | string[] | undefined = entity[this.secondaryAttributeName];
      const componentData = this.cell?.componentData as any;
      if (!secondaryValues && componentData?.optionsMap) {
        secondaryValues = componentData.optionsMap[entity.id] || componentData.optionsMap[entity.name];
      }

      if (Array.isArray(secondaryValues)) {
        this.secondaryOptions = [...secondaryValues];
      } else if (typeof secondaryValues === 'string') {
        this.secondaryOptions = secondaryValues.split(',').map(value => value.trim());
      } else {
        this.secondaryOptions = [];
      }

      const secondaryControl = this.formGroup.get(this.secondaryAttributeName);
      if (secondaryControl && secondaryControl.value && !this.secondaryOptions.includes(secondaryControl.value)) {
        secondaryControl.setValue(null);
      }

      this.updateCombinedValue();
    }
    else {
      this.secondaryOptions = [];
      const secondaryControl = this.formGroup.get(this.secondaryAttributeName);
      if (secondaryControl) {
        secondaryControl.setValue(null);
      }
      this.combinedValue = '—';
    }
    this.cdr.markForCheck();
  }

  private updateCombinedValue(): void {
    if (this.currentEntity && this.currentEntity.name) {
      const secondaryControl = this.formGroup.get(this.secondaryAttributeName);
      const secondaryVal = secondaryControl?.value;
      this.combinedValue = secondaryVal ? `${this.currentEntity.name} - ${secondaryVal}` : this.currentEntity.name;
    } else {
      this.combinedValue = '—';
    }
    this.cdr.markForCheck();
  }

  isShowLabelTop(cell: CellAttribute): boolean {
    // We default to "Top" if not supplied
    return !cell.labelLayout || cell.labelLayout === LabelLayoutType.Top;
  }

  isShowLabelLeft(cell: CellAttribute): boolean {
    return cell.labelLayout === LabelLayoutType.Left;
  }

  ngOnDestroy(): void {
    if (this.secondarySub) {
      this.secondarySub.unsubscribe();
    }
  }
}
