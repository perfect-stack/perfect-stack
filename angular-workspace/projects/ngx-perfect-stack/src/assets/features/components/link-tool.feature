Feature: Link Tool Component
  As a user reading form instructions and navigation prompts
  I want inline links embedded naturally inside text
  So that I can trigger actions or navigate to related pages directly

  @showcase @link-tool
  Scenario: Display inline link tool with clickable anchor
    When I navigate to "/showcase/link-tool"
    Then the showcase header should display "LinkToolComponent"
    And the link tool should display link text "here to view clinic schedule"
