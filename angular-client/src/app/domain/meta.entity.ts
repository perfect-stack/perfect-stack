import {TemplateMap} from './meta.page';

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

export class MetaEntity {
  name: string;
  attributes: MetaAttribute[];
  templates: TemplateMap;
}
