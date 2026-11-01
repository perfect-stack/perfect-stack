Feature: Last Sign In Tool Component
  As an administrator
  I want to see the last sign-in timestamp for accounts
  So that user authentication history is visible

  @showcase @last-sign-in-tool
  Scenario: Display user last sign-in timestamp
    When I navigate to "/showcase/last-sign-in-tool"
    Then the showcase header should display "LastSignInToolComponent"
    And the last sign in tool should be visible
    When I click the showcase button "btn-mode-view"
    Then the last sign in tool should be visible
    When I click the showcase button "btn-mode-edit"
    Then the last sign in tool should be visible
