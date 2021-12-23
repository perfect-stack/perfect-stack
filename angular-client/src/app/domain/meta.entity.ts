export enum AttributeType {
  Text = 'Text',
  Number = 'Number',
  Identifier = 'Identifier',
  Date = 'Date'
}

export enum VisibilityType {
  Visible = 'Visible',
  Hidden = 'Hidden,'
}

export class MetaAttribute {
  name: string;
  label: string;
  description: string;
  type: AttributeType.Text;
  visibility: VisibilityType.Visible;
}

export class Cell {
  width: string;
  height: string;
  attributeName?: string;
}

export class Template {
  name: string;
  cells: Cell[][] = [
    [
      { width: '3', height: '1'},
      { width: '3', height: '1'},
      { width: '3', height: '1'},
      { width: '3', height: '1'},
    ],
    [
      { width: '6', height: '1'},
      { width: '6', height: '1'},
    ]
  ];
}

export type TemplateMap = {
  [key: string]: Template;
};

export class MetaEntity {
  name: string;
  attributes: MetaAttribute[];
  templates: TemplateMap;
}
