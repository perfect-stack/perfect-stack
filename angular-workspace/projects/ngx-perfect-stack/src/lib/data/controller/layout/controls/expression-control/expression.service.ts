import { Injectable } from '@angular/core';
import {UntypedFormGroup} from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class ExpressionService {

  constructor() { }

  updateOrView(mode: string, params: any[]): string {
    console.log(`updateOrView: mode = ${mode}, params = ${JSON.stringify(params)}`);
    if(params && params.length === 2) {
      const name = params[0];
      const id = params[1]; // if there is an id, then call it "Update", if no id then call it "Add"
      return mode === 'view' ? name : id ? 'Update ' + name : 'Add ' + name;
    }
    else {
      throw new Error(`Incorrect number of parameters supplied. Expected 2, but got ${JSON.stringify(params)}`);
    }
  }

  mapSexSymbolToIcon(controlExpressionMatchList: ControlExpressionMatch[]): string {
    if(controlExpressionMatchList.length === 1) {
      const sex = controlExpressionMatchList[0].value;
      if(sex) {
        const sexSymbolMap = new Map<string, string>();
        sexSymbolMap.set('Male', 'male');
        sexSymbolMap.set('Female', 'female');
        sexSymbolMap.set('Unknown', 'question_mark');
        const iconName = sexSymbolMap.get(sex);
        if(iconName) {
          return iconName
        }
        else {
          return 'error'; // If not found then convert the icon into an error
        }
      }
      else {
        return ''; // No sex value so just return an empty name
      }
    }
    else {
      throw new Error('Must supply exactly one parameter value to this method');
    }
  }

  mapSexSymbolToIconStyle(controlExpressionMatchList: ControlExpressionMatch[]): string {
    return `sex-symbol-${this.mapSexSymbolToIcon(controlExpressionMatchList)}`;
  }

  evaluate(expression: string, dataMap: Map<string, any>): string {
    const controlExpressionMatchList = this.buildControlExpressionMatchList(expression, dataMap);
    if(expression.startsWith('?')) {
      const methodName = this.resolveMethodName(expression);
      return this.invokeMethod(methodName, controlExpressionMatchList);
    }
    else {
      return this.searchAndReplace(expression, controlExpressionMatchList);
    }
  }

  private buildControlExpressionMatchList(expression: string, dataMap: Map<string, any>): ControlExpressionMatch[] {
    const controlExpressionMatchList: ControlExpressionMatch[] = [];
    const matches: RegExpMatchArray[] = Array.from(expression.matchAll(/\${([a-zA-Z0-9_\\.]+)}/gm));
    for(const nextMatch of matches) {
      const path = nextMatch[1];
      const entity = this.resolveToEntity(path, dataMap);
      const value = this.resolveToValue(path, entity)
      controlExpressionMatchList.push({
        value: value,
        expressionMatch: nextMatch,
      });
    }
    return controlExpressionMatchList;
  }

  private resolveMethodName(expression: string): string {
    if(expression.startsWith('?')) {
      const idx = expression.indexOf('(');
      if(idx >= 0) {
        const methodName = expression.substring(1, idx);
        return methodName;
      }
      else {
        throw new Error('Expression Syntax Error. If method invocation is specified with a starting ? then end of method name must be marked with a (');
      }
    }
    else {
      throw new Error('Expression does not start with the method invocation symbol of ?');
    }
  }

  private invokeMethod(methodName: string, controlExpressionMatchList: ControlExpressionMatch[]): string {
    if(methodName === 'mapSexSymbolToIcon') {
      return this.mapSexSymbolToIcon(controlExpressionMatchList)
    }
    if(methodName === 'mapSexSymbolToIconStyle') {
      return this.mapSexSymbolToIconStyle(controlExpressionMatchList)
    }
    else {
      throw new Error(`Unknown method name of ${methodName}`);
    }
  }

  private searchAndReplace(expression: string, controlExpressionMatchList: ControlExpressionMatch[]): string {
    let expressionResult = expression;
    for(const nextControlExpression of controlExpressionMatchList) {
      const search = nextControlExpression.expressionMatch[0];
      const replaceValue = nextControlExpression.value ? String(nextControlExpression.value) : '';
      expressionResult = expressionResult.replace(search, replaceValue.trim());
    }

    return expressionResult;
  }

  resolveToEntity(path: string, dataMap: Map<string, any>) {
    if(path.indexOf('.') >= 0) {
      const name = path.substring(0, path.indexOf('.'));
      const dataMapResult = dataMap.get(name);
      if(dataMapResult) {
        return dataMapResult.result;
      }
      else {
        throw new Error(`No data results for path ${path} in data map.`);
      }
    }
    else {
      throw new Error(`Unable to find entity using the path ${path}`);
    }
  }

  resolveToValue(path: string, entity: any) {
    const tokens = path.split('.');
    if(tokens.length > 0) {
      const attribute = tokens[1];
      const value = entity[attribute];
      return value;
    }
    else {
      throw new Error(`Unable to find attribute using the path ${path}`);
    }
  }


  evaluateFormGroup(expression: string, formGroup: UntypedFormGroup): string {
    const controlExpressionMatchList = this.buildFromFormGroup(expression, formGroup);
    if(expression.startsWith('?')) {
      const methodName = this.resolveMethodName(expression);
      return this.invokeMethod(methodName, controlExpressionMatchList);
    }
    else {
      return this.searchAndReplace(expression, controlExpressionMatchList);
    }
  }

  buildFromFormGroup(expression: string, formGroup: UntypedFormGroup) {
    const controlExpressionMatchList: ControlExpressionMatch[] = [];
    const matches: RegExpMatchArray[] = Array.from(expression.matchAll(/\${([a-zA-Z0-9_\\.]+)}/gm));
    for(const nextMatch of matches) {
      const control = this.findControlInFormGroup(nextMatch[1], formGroup);
      if(control) {
        controlExpressionMatchList.push({
          expressionMatch: nextMatch,
          value: control.value,
        });
      }
    }
    return controlExpressionMatchList;
  }

  findControlInFormGroup(attributeName: string, formGroup: UntypedFormGroup) {
    if(formGroup) {
      const control = formGroup.controls[attributeName];
      if (control) {
        return control;
      }
      else {
        throw new Error(`Unable to find attribute ${attributeName} in formGroup`);
      }
    }
    else {
      throw new Error(`No formGroup supplied`);
    }
  }

  /**
   * This is potentially the start of a more complex "escaping" mechanism where certain expressions have special
   * characters replaced so they become "code" friendly. For example spaces replaced by dashes for CSS styles.
   */
  replaceSpaces(value: string, replaceValue: string) {
    return value.replace(' ', replaceValue);
  }

}


interface ControlExpressionMatch {
  value: any;
  expressionMatch: RegExpMatchArray;
}
