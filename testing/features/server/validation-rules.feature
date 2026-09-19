Feature: DataService Validation Rules
  As an application using nestjs-server
  I want entity attributes to be validated before saving
  So that invalid or duplicate data is rejected without persisting to the database

  Scenario: Reject saving when required fields are missing
    Given a new "Person" entity with the following attributes:
      | email_address | invalid.person@example.com |
    When I save the entity
    Then the save response should have action "None"
    And the validation results should contain an error for "given_name"
    And the validation results should contain an error for "family_name"

  Scenario: Reject saving when email format is invalid
    Given a new "Person" entity with the following attributes:
      | given_name    | Bob                 |
      | family_name   | Builder             |
      | email_address | not-a-valid-email   |
    When I save the entity
    Then the save response should have action "None"
    And the validation results should contain an error for "email_address"

  Scenario: Reject saving when unique case-insensitive constraint is violated
    Given a new "Person" entity with the following attributes:
      | given_name    | Charlie                    |
      | family_name   | Chaplin                    |
      | email_address | charlie.unique@example.com |
    When I save the entity
    Then the entity should be saved successfully with a valid UUID
    Given a new "Person" entity with the following attributes:
      | given_name    | Another                    |
      | family_name   | Person                     |
      | email_address | CHARLIE.UNIQUE@EXAMPLE.COM |
    When I save the entity
    Then the save response should have action "None"
    And the validation results should contain an error for "email_address"
