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
