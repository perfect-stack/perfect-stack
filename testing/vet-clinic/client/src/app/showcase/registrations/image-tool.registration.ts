import { ShowcaseItem } from '../showcase.model';
import { AttributeType, ComparisonOperator, VisibilityType } from '@perfect-stack/ngx-perfect-stack';
import { ToolType } from '@perfect-stack/ngx-perfect-stack';

// -------------------------------------------------------------------------
// CATEGORY: Diagnostic Tools
// -------------------------------------------------------------------------
export const imageToolRegistration: ShowcaseItem = {
  id: 'image-tool',
  name: 'ImageToolComponent',
  selector: '<lib-image-tool>',
  category: 'Diagnostic Tools',
  description: 'Page asset layout tool for rendering static or remote image resources, icons, and diagrams with custom CSS styling.',
  attribute: {
    name: 'image',
    label: 'Image Asset',
    description: 'Visual image resource',
    type: AttributeType.Text,
    visibility: VisibilityType.Visible,
    comparisonField: '',
    comparisonOperator: ComparisonOperator.Equals,
    relationshipTarget: '',
    typeaheadSearch: [],
    discriminator: { entityMappingList: [], discriminatorName: '', discriminatorType: '' },
    rules: [],
    enumeration: [],
    unitOfMeasure: '',
    scale: '',
  },
  cell: {
    width: '6',
    height: '2',
    tool: {
      type: ToolType.Image,
      imageUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=400&q=80',
      styles: 'rounded shadow-sm img-fluid'
    } as any
  },
  initialValue: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=400&q=80',
  samplePresets: [
    {
      label: 'Dog Photo',
      value: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=400&q=80'
    },
    {
      label: 'Cat Photo',
      value: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=400&q=80'
    }
  ],
  docProperties: [
    { property: 'Tool Type', description: 'ToolType.Image' },
    { property: 'Image URL', description: 'Remote URL or static bundle asset path.' },
    { property: 'Custom Styles', description: 'Applies CSS utility classes, e.g. "rounded img-fluid".' },
    { property: 'Editor Integration', description: 'Integrates with PropertySheetService in layout editor mode.' }
  ],
  metaPageJson: {
    width: '6',
    height: '2',
    tool: {
      type: ToolType.Image,
      imageUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=400&q=80',
      styles: 'rounded shadow-sm img-fluid'
    }
  },
  featurePath: '/assets/features/components/image-tool.feature',
  fallbackFeature: `Feature: Image Tool Component
  As a page designer
  I want an image tool to display brand assets, illustrations, or diagrams
  So that visual media enhances the layout presentation

  @showcase @image-tool
  Scenario: Display image tool asset in edit and view modes
    When I navigate to "/showcase/image-tool"
    Then the showcase header should display "ImageToolComponent"
    And the image tool should be visible
    When I click the showcase button "btn-mode-view"
    Then the image tool should be visible
    When I click the showcase button "btn-mode-edit"
    Then the image tool should be visible`
};
