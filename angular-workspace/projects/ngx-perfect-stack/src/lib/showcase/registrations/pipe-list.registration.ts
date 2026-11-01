import { ShowcaseItem } from '../showcase.model';
import { AttributeType, ComparisonOperator, VisibilityType } from '../../domain/meta.entity';

export const pipeListRegistration: ShowcaseItem = {
      id: 'pipe-list',
      name: 'PipeListControlComponent',
      selector: '<lib-pipe-list-control>',
      category: 'Selections & Badges',
      description: 'Multi-tag token selector storing selections as a pipe-delimited string (e.g. "Urgent|Surgery"). Displays active badges with remove icons and clickable pill buttons for available options in edit mode, and read-only badges in view mode.',
      attribute: {
        name: 'procedure_tags',
        label: 'Procedure Tags',
        description: 'Pipe-delimited set of clinical procedure tags',
        type: AttributeType.Text,
        visibility: VisibilityType.Visible,
        comparisonField: '',
        comparisonOperator: ComparisonOperator.Equals,
        relationshipTarget: '',
        typeaheadSearch: [],
        discriminator: { entityMappingList: [], discriminatorName: '', discriminatorType: '' },
        rules: [],
        enumeration: ['Urgent', 'Surgery', 'Consultation', 'Follow-up', 'Vaccination'],
        unitOfMeasure: '',
        scale: '',
      },
      cell: {
        width: '8',
        height: '1',
        attributeName: 'procedure_tags',
        component: 'PipeList',
      },
      initialValue: 'Urgent|Surgery',
      samplePresets: [
        { label: 'Urgent + Surgery', value: 'Urgent|Surgery' },
        { label: 'Consultation + Follow-up', value: 'Consultation|Follow-up' },
        { label: 'All Tags', value: 'Urgent|Surgery|Consultation|Follow-up|Vaccination' },
        { label: 'Clear', value: '' }
      ],
      docProperties: [
        { property: 'Supported Types', description: 'Text (pipe-delimited string "A|B|C")' },
        { property: 'Options Source', description: 'Parsed from options property, cell.options, or cell.attribute.enumeration.' },
        { property: 'Edit Mode', description: 'Removable badges with close icon plus quick-add buttons for available tags.' },
        { property: 'View Mode', description: 'Read-only badges for selected tags or &mdash; if empty.' }
      ],
      metaPageJson: { width: '8', height: '1', attributeName: 'procedure_tags', component: 'PipeList' },
      featurePath: '/assets/features/components/pipe-list.feature',
      fallbackFeature: `Feature: Pipe List Control Component
  As a veterinary clinician
  I want to select multiple tags stored as a pipe-delimited string
  So that complex categorizations can be tagged and untagged interactively

  Scenario: Add and remove pipe-delimited tags in edit and view modes
    When I navigate to "/showcase/pipe-list"
    Then the showcase header should display "PipeListControlComponent"
    And the pipe list should contain selected tag "Urgent"
    And the pipe list should contain selected tag "Surgery"
    When I add tag "Vaccination" to the pipe list
    Then the pipe list should contain selected tag "Vaccination"
    Then the form state inspector should show value "Urgent|Surgery|Vaccination"
    When I click the showcase button "btn-mode-view"
    Then the pipe list view should contain tag "Urgent"
    And the pipe list view should contain tag "Vaccination"
    When I click the showcase button "btn-mode-edit"
    When I remove tag "Urgent" from the pipe list
    Then the form state inspector should show value "Surgery|Vaccination"`
    };
