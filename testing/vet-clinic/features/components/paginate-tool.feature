Feature: Paginate Tool Component
  As a user navigating large datasets
  I want a pagination control toolbar to jump between pages of results
  So that I can review paginated search listings efficiently

  @showcase @paginate-tool
  Scenario: Display pagination control toolbar in the Component Showcase
    When I navigate to "/showcase/paginate-tool"
    Then the showcase header should display "PaginateToolComponent"
    And the pagination tool should be visible
    When I click the showcase button "btn-mode-view"
    Then the pagination tool should be visible
    When I click the showcase button "btn-mode-edit"
    Then the pagination tool should be visible
