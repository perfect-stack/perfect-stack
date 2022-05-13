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
  formGroup: FormGroup;

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
    const matches: RegExpMatchArray[] = Array.from(this.expression.matchAll(/\${(\w+)}/gm));
    for(const nextMatch of matches) {
      const control = this.formGroup.get(nextMatch[1]);
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

    this.updateExpressionValue();
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

