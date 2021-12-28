import { TemplateMap } from './meta.page';

export type AttributeType = 'Text' | 'Number' | 'Identifier' | 'Date';
export type VisibilityType = 'Visible' | 'Hidden';

export class MetaAttribute {
  name: string;
  label: string;
  description: string;
  type: AttributeType = 'Text';
  visibility: VisibilityType = 'Visible';
}

export class MetaEntity {
  name: string;
  attributes: MetaAttribute[];
  templates: TemplateMap;
}
