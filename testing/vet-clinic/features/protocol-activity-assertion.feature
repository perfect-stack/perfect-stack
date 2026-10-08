Feature: Protocol, Activity Template, and Assertion Type Hierarchy
  As a field researcher or clinic administrator
  I want to view protocols, activity templates, and assertion types
  So that I can verify the nested hierarchical relationships and navigation

  @protocol @regression
  Scenario: Search Protocols and view nested Activity Templates
    When I navigate to "/data/Protocol/search"
    Then I should see "Bird Capture" in the search results table
    When I click on the protocol row for "Bird Capture"
    Then I should see "Bird Capture" in the "protocol_name" field
    And I should see the nested one-to-many "activity_templates" table
    And I should see "Capture detail" in the "activity_templates" table
    And I should see "Marking by Banding" in the "activity_templates" table

  @activity-template @regression
  Scenario: Search Activity Templates and view nested Assertion Types
    When I navigate to "/data/ActivityTemplate/search"
    Then I should see "Capture detail" in the search results table
    When I click on the activity template row for "Capture detail"
    Then I should see "Capture detail" in the "activity_template_name" field
    And I should see the nested one-to-many "assertion_types" table
    And I should see "Capture technique" in the "assertion_types" table

  @assertion-type @regression
  Scenario: Search Assertion Types
    When I navigate to "/data/AssertionType/search"
    Then I should see "Capture technique" in the search results table

  @protocol-tree @regression
  Scenario: View Protocol Hierarchy Tree and inspect Master-Detail Views
    When I navigate to "/data/Protocol/tree"
    Then I should see the tree node "Bird Capture"
    And I should see the tree badge "Protocol" on node "Bird Capture"
    And I should see the detail panel header "Bird Capture"
    And I should see the edit node button for "Protocol"
    And I should see the nested one-to-many "activity_templates" table
    And I should see "Capture detail" in the "activity_templates" table
    When I click the tree node "Capture detail"
    Then I should see the detail panel header "Capture detail"
    And I should see the edit node button for "ActivityTemplate"
    And I should see the nested one-to-many "assertion_types" table
    And I should see "Capture technique" in the "assertion_types" table
    When I click the tree node "Capture technique"
    Then I should see the detail panel header "Capture technique"
    And I should see the edit node button for "AssertionType"

  @protocol-tree-edit @regression
  Scenario: Edit tree node in place and prompt on unsaved changes
    When I navigate to "/data/Protocol/tree"
    Then I should see the tree node "Bird Capture"
    When I click the tree node "Capture technique"
    Then I should see the detail panel header "Capture technique"
    When I click the edit node button
    Then I should see the save node button
    And I should see "Capture technique" in the "assertion_type_name" field
    When I enter "Capture technique modified" into the "assertion_type_name" field
    When I click the tree node "Capture detail"
    Then I should see the unsaved changes dialog
    When I click "Cancel" in the dialog
    Then I should see the save node button
    When I click the save node button
    Then I should see the edit node button for "AssertionType"
    And I should see the detail panel header "Capture technique modified"
    And I should see the tree node "Capture technique modified"
    When I click the edit node button
    And I enter "Capture technique" into the "assertion_type_name" field
    When I click the save node button
    Then I should see the edit node button for "AssertionType"
    And I should see the detail panel header "Capture technique"
