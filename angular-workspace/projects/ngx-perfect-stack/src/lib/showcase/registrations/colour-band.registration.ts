import { ShowcaseItem } from '../showcase.model';
import { AttributeType, ComparisonOperator, VisibilityType } from '../../domain/meta.entity';

export const colourBandRegistration: ShowcaseItem = {
      id: 'colour-band',
      name: 'ColourBandComponent',
      selector: '<lib-colour-band-component>',
      category: 'Pickers & Calendars',
      description: 'Interactive color picker and palette selector with modal picker dialog for physical bands, markers, or status colors.',
      attribute: {
        name: 'colour_band',
        label: 'Marker Colour',
        description: 'Hex or named color attribute',
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
        width: '4',
        height: '1',
        attributeName: 'colour_band',
        component: 'ColourBand',
      },
      initialValue: '#42A948',
      samplePresets: [
        { label: 'Green (#42A948)', value: '#42A948' },
        { label: 'Blue (#3B82F6)', value: '#3B82F6' },
        { label: 'Red (#EF4444)', value: '#EF4444' },
        { label: 'Clear', value: '' }
      ],
      docProperties: [
        { property: 'Supported Types', description: 'Text, Colour' },
        { property: 'Modal Dialog', description: 'Opens ColourBandDialogComponent via NgbModal.' },
        { property: 'Edit Mode', description: 'Color preview square + hex code input with click-to-pick modal.' },
        { property: 'View Mode', description: 'Color swatch indicator box next to color value.' }
      ],
      metaPageJson: { width: '4', height: '1', attributeName: 'colour_band', component: 'ColourBand' },
      featurePath: '/assets/features/components/colour-band.feature',
      fallbackFeature: `Feature: Colour Band Control Component
  As a field researcher or clinic manager
  I want a visual color band selector to tag and identify categories or physical markers
  So that color combinations are visually distinguishable in both edit and view modes

  Scenario: Display color band in edit and view modes
    When I navigate to "/showcase/colour-band"
    Then the showcase header should display "ColourBandComponent"
    When I click the showcase button "btn-mode-view"
    Then the color band view should display the active color swatch
    When I click the showcase button "btn-mode-edit"
    Then the color band interactive input should be visible`
    };
