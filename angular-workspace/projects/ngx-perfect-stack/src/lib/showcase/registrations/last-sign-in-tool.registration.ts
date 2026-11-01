import { ShowcaseItem } from '../showcase.model';
import { AttributeType, ComparisonOperator, VisibilityType } from '../../domain/meta.entity';
import { ToolType } from '../../domain/meta.page';

// -------------------------------------------------------------------------
// CATEGORY: Diagnostic Tools
// -------------------------------------------------------------------------
export const lastSignInToolRegistration: ShowcaseItem = {
  id: 'last-sign-in-tool',
  name: 'LastSignInToolComponent',
  selector: '<lib-last-sign-in-tool>',
  category: 'Diagnostic Tools',
  description: 'Security and audit diagnostic tool displaying the user authentication timestamp for the active session or target account.',
  attribute: {
    name: 'last_sign_in',
    label: 'Last Sign In',
    description: 'Timestamp of last authentication',
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
    tool: {
      type: ToolType.LastSignIn,
      username: 'admin'
    } as any
  },
  initialValue: 'admin',
  samplePresets: [
    { label: 'Admin User', value: 'admin' },
    { label: 'Dr. John Smith', value: 'john.smith' }
  ],
  docProperties: [
    { property: 'Tool Type', description: 'ToolType.LastSignIn' },
    { property: 'Authentication Endpoint', description: 'Queries /authentication/last-sign-in/:username' },
    { property: 'Timezone Formatting', description: 'Formats UTC timestamp into configured local timezone pattern.' },
    { property: 'Session Auditing', description: 'Useful for security auditing and login visibility.' }
  ],
  metaPageJson: {
    width: '6',
    height: '1',
    tool: {
      type: ToolType.LastSignIn,
      username: 'admin'
    }
  },
  featurePath: '/assets/features/components/last-sign-in-tool.feature',
  fallbackFeature: `Feature: Last Sign In Tool Component
  As an administrator
  I want to see the last sign-in timestamp for accounts
  So that user authentication history is visible

  @showcase @last-sign-in-tool
  Scenario: Display user last sign-in timestamp
    When I navigate to "/showcase/last-sign-in-tool"
    Then the showcase header should display "LastSignInToolComponent"
    And the last sign in tool should be visible
    When I click the showcase button "btn-mode-view"
    Then the last sign in tool should be visible
    When I click the showcase button "btn-mode-edit"
    Then the last sign in tool should be visible`
};
