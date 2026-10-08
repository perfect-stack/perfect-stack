@geometry
Feature: Clinic Geometry Control Display
  As a veterinary clinic receptionist
  I want to view the GeoJSON geometry of a clinic
  So that I can see the coordinates and toggle between single-line and expanded views

  Scenario: View and expand GeoJSON point coordinates
    When I navigate to "/data/Clinic/search"
    And I click on the clinic row for "PETVET Lower Hutt"
    Then I should see "PETVET Lower Hutt" in the "name" field
    And the geometry field should display GeoJSON for a "Point"
    When I toggle the geometry field expansion
    Then the geometry field should be expanded
    When I toggle the geometry field expansion
    Then the geometry field should not be expanded
