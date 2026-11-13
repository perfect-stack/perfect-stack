Feature: Geometry Control Component
  As a spatial data user or technician
  I want a GeoJSON input control with live syntax and coordinate validation
  So that GIS features and clinic coordinates are stored accurately

  @showcase @geometry-control
  Scenario: Display and edit GeoJSON geometry
    When I navigate to "/showcase/geometry-control"
    Then the showcase header should display "GeometryControlComponent"
    And the geometry control summary should contain "Point"
    When I click the geometry control GeoJSON toggle button
    Then the geometry control textarea should contain "Point"
    When I click the showcase button "btn-mode-view"
    Then the geometry control should be visible
    When I click the showcase button "btn-mode-edit"
    Then the geometry control textarea should contain "Point"
