import { ShowcaseItem } from '../showcase.model';
import { AttributeType, ComparisonOperator, VisibilityType } from '../../domain/meta.entity';

export const urlFieldRegistration: ShowcaseItem = {
      id: 'url-field',
      name: 'UrlFieldControlComponent',
      selector: '<lib-url-field-control>',
      category: 'Inputs & Primitives',
      description: 'Web hyperlink input rendering an interactive text box in edit mode, and a secure clickable hyperlink with an external link indicator in view mode.',
      attribute: {
        name: 'website_url',
        label: 'Website Link',
        description: 'Hyperlink URL attribute',
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
        height: '1',
        attributeName: 'website_url',
        component: 'Url',
      },
      initialValue: 'https://perfect-stack.org',
      samplePresets: [
        { label: 'Perfect-Stack', value: 'https://perfect-stack.org' },
        { label: 'Angular Dev', value: 'https://angular.dev' },
        { label: 'Clear', value: '' }
      ],
      docProperties: [
        { property: 'Supported Types', description: 'Url, Text' },
        { property: 'Edit Mode', description: 'Renders <input type="url" class="form-control">.' },
        { property: 'View Mode', description: 'Renders clickable <a target="_blank" rel="noopener"> link.' }
      ],
      metaPageJson: { width: '6', height: '1', attributeName: 'website_url', component: 'Url' },
      featurePath: '/assets/features/components/url-field.feature',
      fallbackFeature: `Feature: URL Field Control Component
  As a user managing web references and external links
  I want a dedicated URL field component that renders editable text in edit mode and clickable hyperlinks in view mode
  So that links can be directly navigated and checked

  Scenario: Edit URL and inspect clickable link in view mode
    When I navigate to "/showcase/url-field"
    Then the showcase header should display "UrlFieldControlComponent"
    When I click the showcase button "btn-mode-view"
    Then the URL view link should be visible with text "https://perfect-stack.org"
    When I click the showcase button "btn-mode-edit"
    Then the URL input should be editable and contain "https://perfect-stack.org"`
    };
