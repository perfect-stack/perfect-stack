import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ExpressionService {

  constructor() { }

  updateOrView(mode: string, params: any[]): string {
    return mode === 'view' ? params.join(' ') : 'Update ' + params.join(' ');
  }

  evaluate(expression: string, dataMap: Map<string, any>): string {
    const controlExpressionMatchList = this.buildControlExpressionMatchList(expression, dataMap);
    return this.searchAndReplace(controlExpressionMatchList, expression);
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

  private searchAndReplace(controlExpressionMatchList: ControlExpressionMatch[], expression: string): string {
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
}


interface ControlExpressionMatch {
  value: any;
  expressionMatch: RegExpMatchArray;
}
