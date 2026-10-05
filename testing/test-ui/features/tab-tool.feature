Feature: Tab Tool Recursive Layout
  As a veterinary clinic receptionist
  I want to view and switch tabs on a record
  So that nested layout templates render dynamically and state transitions without errors

  @tabs @regression
  Scenario: Switch between tabs on Pet View and verify recursive layout rendering
    When I navigate to "/data/Pet/search"
    And I click on the pet row for "Jack"
    Then I should see "Jack" in the "name" field
    And I should see the "Single" tab is active
    And I should see the single media control
    When I click the "Multiple" tab
    Then I should see the "Multiple" tab is active
    And I should see the media gallery control
    When I click the "Single" tab
    Then I should see the "Single" tab is active
    And I should see the single media control
