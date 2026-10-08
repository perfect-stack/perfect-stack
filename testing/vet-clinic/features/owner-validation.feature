Feature: Owner Validation Rules
  As a veterinary clinic receptionist
  I want required fields to be validated when creating an Owner
  So that incomplete Owner records cannot be saved and helpful validation error messages appear

  @validation @owner
  Scenario: Display validation errors when attempting to save an Owner without required fields
    When I navigate to "/data/Owner/search"
    And I click the "Add Owner" button
    And I click the "Save details" button
    Then I should see an error message "Attribute required" under the "given_name" field
    And I should see an error message "Attribute required" under the "family_name" field
