@map
Feature: Clinic Map Tool Display
  As a veterinary clinic receptionist
  I want to view a clinic's geographical location on the map
  So that I can identify where the clinic is located

  Scenario: Display clinic location on the map
    When I navigate to "/data/Clinic/search"
    And I click on the clinic row for "PETVET Lower Hutt"
    Then the page title should not be empty
    And I should see "PETVET Lower Hutt" in the "name" field
    And I should see the map tool component
    And the map should display a location marker

  Scenario: Update geometry control when changing map via shift-click in edit mode
    When I navigate to "/data/Clinic/search"
    And I click on the clinic row for "PETVET Lower Hutt"
    And I click the "Edit" button
    Then the page title should not be empty
    And I should see the map tool component
    When I shift-click on the map to change the location
    Then the geometry field should display GeoJSON for a "Point"

  Scenario: Update geometry control when changing map via sketch tool in edit mode
    When I navigate to "/data/Clinic/search"
    And I click on the clinic row for "PETVET Lower Hutt"
    And I click the "Edit" button
    Then the page title should not be empty
    And I should see the map tool component
    When I use the sketch tool to place a point on the map
    Then the geometry field should display GeoJSON for a "Point"
