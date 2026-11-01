Feature: Image Tool Component
  As a page designer
  I want an image tool to display brand assets, illustrations, or diagrams
  So that visual media enhances the layout presentation

  @showcase @image-tool
  Scenario: Display image tool asset in edit and view modes
    When I navigate to "/showcase/image-tool"
    Then the showcase header should display "ImageToolComponent"
    And the image tool should be visible
    When I click the showcase button "btn-mode-view"
    Then the image tool should be visible
    When I click the showcase button "btn-mode-edit"
    Then the image tool should be visible
