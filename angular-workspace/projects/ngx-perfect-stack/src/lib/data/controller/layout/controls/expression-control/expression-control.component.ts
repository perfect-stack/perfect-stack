import {Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {AbstractControl, FormGroup} from '@angular/forms';
import {Subscription} from 'rxjs';
import {ExpressionService} from './expression.service';

@Component({
  selector: 'lib-expression-control',
  templateUrl: './expression-control.component.html',
  styleUrls: ['./expression-control.component.css']
})
export class ExpressionControlComponent implements OnChanges, OnDestroy {

  @Input()
  mode: string;

  @Input()
  formMap: Map<string, AbstractControl>;

  @Input()
  expression: string;

  controlExpressionListenerList: ControlExpressionListener[] = [];
  expressionValue: any;

  constructor(protected expressionService: ExpressionService) { }

  ngOnChanges(changes: SimpleChanges): void {
    this.update();
  }

  update() {
    console.log(`ExpressionControlComponent:update()`);
    // reset listeners
    if(this.controlExpressionListenerList.length > 0) {
      this.ngOnDestroy();
      this.controlExpressionListenerList = [];
    }

    // Create a list of control expressions
    if(this.formMap) {
      console.log('ExpressionControlComponent: formGroup:', this.formMap);
      const matches: RegExpMatchArray[] = Array.from(this.expression.matchAll(/\${([a-zA-Z0-9_\\.]+)}/gm));
      for(const nextMatch of matches) {
        const control = this.findControl(nextMatch[1], this.formMap);
        if(control) {
          const subscription = control.valueChanges.subscribe(() => {
            this.updateExpressionValue();
          });

          // Listen to their value change listeners
          this.controlExpressionListenerList.push({
            expressionMatch: nextMatch,
            control: control,
            subscription: subscription,
          });
        }
      }
    }

    this.updateExpressionValue();
  }

  /**
   * @param nakedExpression - the expression without the ${} around it so; "bird.name" instead of ${bird.name}. The
   * regex code gives it to us nicely.
   */
  findControl(nakedExpression: string, formMap: Map<string, AbstractControl>): AbstractControl {
    if(nakedExpression) {
      if(formMap && formMap.size > 0) {
        const tokens = nakedExpression.split('.');
        if(tokens.length == 2) {
          const binding = tokens[0];
          const attributeName = tokens[1];
          const formGroup = formMap.get(binding) as FormGroup;
          if(formGroup) {
            const control = formGroup.controls[attributeName];
            if(control) {
              return control;
            }
            else {
              throw new Error(`Unable to findControl ${attributeName} with binding ${binding}`);
            }
          }
          else {
            throw new Error(`Unable to formGroup for binding ${binding}`);
          }
        }
        else {
          throw new Error(`Unable to split expression ${nakedExpression} into exactly two tokens`);
        }
      }
      else {
        throw new Error(`No formMap has been supplied or is empty`);
      }
    }
    else {
      throw new Error(`No expression has been supplied`);
    }
  }

  private updateExpressionValue() {
    if(this.expression.startsWith('?')) {
      this.invokeServiceMethod();
    }
    else {
      this.searchAndReplace();
    }
  }

  invokeServiceMethod() {
    const params = []

    for(const nextControlExpression of this.controlExpressionListenerList) {
      params.push(nextControlExpression.control.value);
    }

    this.expressionValue = this.expressionService.updateOrView(this.mode, params)
  }

  searchAndReplace() {
    let nextExpressionValue = this.expression;
    for(const nextControlExpression of this.controlExpressionListenerList) {
      const search = nextControlExpression.expressionMatch[0];
      let replace = String(nextControlExpression.control.value);
      if(replace) {
        nextExpressionValue = nextExpressionValue.replace(search, replace.trim());
      }
    }
    this.expressionValue = nextExpressionValue;
  }

  ngOnDestroy(): void {
    for(const nextControlExpression of this.controlExpressionListenerList) {
      nextControlExpression.subscription.unsubscribe();
    }
  }
}


interface ControlExpressionListener {
  expressionMatch: RegExpMatchArray;
  control: AbstractControl;
  subscription: Subscription;
}

