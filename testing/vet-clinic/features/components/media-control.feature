Feature: Media Control Component
  As a veterinarian or clinic staff member
  I want to view and review individual patient media files and photos
  So that diagnostic images and physical records can be evaluated

  @showcase @media-control
  Scenario: Display single media control in the Component Showcase
    When I navigate to "/showcase/media-control"
    Then the showcase header should display "MediaControlComponent"
    And the media control should be visible
    When I click the showcase button "btn-mode-view"
    Then the media control should be visible
    When I click the showcase button "btn-mode-edit"
    Then the media control should be visible
