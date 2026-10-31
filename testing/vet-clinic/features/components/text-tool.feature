Feature: Text Tool Component
  As a form designer or clinician
  I want contextual text banners and messages rendered inside form layouts
  So that important instructions, statuses, and alerts are highlighted

  @showcase @text-tool
  Scenario: Display presentation text banner
    When I navigate to "/showcase/text-tool"
    Then the showcase header should display "TextToolComponent"
    And the text tool banner should display "Patient Status: Registered and Active in System"
