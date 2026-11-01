import { ShowcaseItem } from '../showcase.model';
import { AttributeType, ComparisonOperator, VisibilityType } from '../../domain/meta.entity';
import { ToolType } from '../../domain/meta.page';

export const linkToolRegistration: ShowcaseItem = {
      id: 'link-tool',
      name: 'LinkToolComponent',
      selector: '<lib-link-tool>',
      category: 'Action & Navigation Tools',
      description: 'Inline text and hyperlink parser. Replaces <a> tags with clickable navigation or action anchors embedded smoothly within sentence text.',
      attribute: {
        name: 'link_navigation',
        label: 'Inline Hyperlink Tool',
        description: 'Inline link parser attribute',
        type: AttributeType.Text,
        visibility: VisibilityType.Optional,
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
        width: '8',
        height: '1',
        attributeName: 'link_navigation',
        tool: {
          type: ToolType.Link,
          channel: 'navigation',
          containerStyles: '',
          styles: '',
          label: 'Patient Schedule',
          modes: '',
          text: 'Click <a>here to view clinic schedule</a> or return to search.',
          action: 'view_schedule',
          route: '/data/Pet/search'
        } as any
      },
      initialValue: 'view_schedule',
      samplePresets: [
        { label: 'Schedule Link', value: 'Click <a>here to view clinic schedule</a> or return to search.' },
        { label: 'Documentation Link', value: 'Need assistance? Read the <a>online documentation</a>.' }
      ],
      docProperties: [
        { property: 'Tool Type', description: 'ToolType.Link' },
        { property: 'Tag Parsing', description: 'Parses <a>...</a> tags into mixed text and clickable LinkFragment objects.' },
        { property: 'Action or Route', description: 'Dispatches custom framework actions or routes via Router.' },
        { property: 'Inline Flow', description: 'Blends seamlessly into surrounding paragraphs and layout labels.' }
      ],
      metaPageJson: {
        width: '8',
        height: '1',
        tool: {
          type: 'Link',
          channel: 'navigation',
          text: 'Click <a>here to view clinic schedule</a> or return to search.',
          action: 'view_schedule'
        }
      },
      featurePath: '/assets/features/components/link-tool.feature',
      fallbackFeature: `Feature: Link Tool Component
  As a user reading form instructions and navigation prompts
  I want inline links embedded naturally inside text
  So that I can trigger actions or navigate to related pages directly

  @showcase @link-tool
  Scenario: Display inline link tool with clickable anchor
    When I navigate to "/showcase/link-tool"
    Then the showcase header should display "LinkToolComponent"
    And the link tool should display link text "here to view clinic schedule"`
    };
