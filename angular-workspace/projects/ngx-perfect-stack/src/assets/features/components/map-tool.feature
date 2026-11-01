Feature: Map Tool Component
  As a clinic coordinator or client
  I want an interactive GIS map displaying clinic location and coordinates
  So that geographical positions are accurately rendered and verified

  @showcase @map-tool
  Scenario: Display map tool in the Component Showcase
    When I navigate to "/showcase/map-tool"
    Then the showcase header should display "MapToolComponent"
    And the map tool component should be visible
    When I click the showcase button "btn-mode-view"
    Then the map tool component should be visible
    When I click the showcase button "btn-mode-edit"
    Then the map tool component should be visible
