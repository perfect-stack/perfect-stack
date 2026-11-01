import { CellAttribute, MetaAttribute } from '@perfect-stack/ngx-perfect-stack';

export interface ShowcaseDocProperty {
  property: string;
  description: string;
}

export interface ShowcasePreset {
  label: string;
  value: any;
}

export interface ShowcaseItem {
  id: string;
  name: string;
  selector: string;
  category: string;
  description: string;
  attribute: MetaAttribute;
  cell: CellAttribute;
  initialValue: any;
  initialSecondaryValue?: any;
  samplePresets: ShowcasePreset[];
  docProperties: ShowcaseDocProperty[];
  metaPageJson: any;
  featurePath: string;
  fallbackFeature: string;
}
