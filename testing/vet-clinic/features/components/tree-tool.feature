Feature: Tree Tool Component
  As a taxonomy researcher or clinician
  I want an interactive hierarchical tree view
  So that I can explore nested relationships and classify species

  @showcase @tree-tool
  Scenario: Display hierarchical tree navigation
    When I navigate to "/showcase/tree-tool"
    Then the showcase header should display "TreeToolComponent"
    And the tree tool should be visible
    When I click the showcase button "btn-mode-view"
    Then the tree tool should be visible
    When I click the showcase button "btn-mode-edit"
    Then the tree tool should be visible
