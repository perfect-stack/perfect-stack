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
