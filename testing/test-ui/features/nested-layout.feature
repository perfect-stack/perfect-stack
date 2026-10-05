Feature: Nested Sub-Template Layout Rendering
  As a veterinary clinic administrator
  I want to view entities that have nested templates
  So that embedded layouts like tables inside form cells render hierarchically without errors

  @nested-layout @regression
  Scenario: View Chordata species and verify embedded child table layout
    When I navigate to "/data/Species/search"
    And I click on the species row for "Chordata"
    Then I should see "Chordata" in the "scientific_name" field
    And I should see the nested child table
    And I should see "Mammalia" in the nested table
    And I should see "Aves" in the nested table
    When I click on the child species row for "Mammalia"
    Then I should see "Mammalia" in the "scientific_name" field
