Feature: Media Gallery Control Component
  As a clinician reviewing multi-image diagnostics
  I want a thumbnail grid gallery of media attachments
  So that I can scan multiple images and navigate pages quickly

  @showcase @media-gallery-control
  Scenario: Display media gallery control in the Component Showcase
    When I navigate to "/showcase/media-gallery-control"
    Then the showcase header should display "MediaGalleryControlComponent"
    And the media gallery control should be visible
    When I click the showcase button "btn-mode-view"
    Then the media gallery control should be visible
    When I click the showcase button "btn-mode-edit"
    Then the media gallery control should be visible
