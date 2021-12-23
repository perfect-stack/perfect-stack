type AttributeType = 'Text' | 'Number' | 'Identifier' | 'Date';
type VisibilityType = 'Visible' | 'Hidden';

export class MetaAttribute {
  name: string;
  label: string;
  description: string;
  type: AttributeType = 'Text';
  visibility: VisibilityType = 'Visible';
}

export class Cell {
  width: string;
  height: string;
  attributeName: string;
}

export class Template {
  name: string;
  cells: Cell[][];
}

export class MetaEntity {
  name: string;
  attributes: MetaAttribute[];
  templates: Map<string, Template>;
}
