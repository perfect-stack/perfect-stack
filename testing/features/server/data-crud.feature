Feature: DataService CRUD Operations
  As an application using nestjs-server
  I want to save, update, and query entities backed by a real database
  So that data persistence and entity lifecycles operate reliably across supported datatypes

  Scenario: Create, update, and retrieve an entity with multiple datatypes and relationships
    Given a new "Person" entity with the following attributes:
      | given_name    | Test                      |
      | family_name   | Cucumber                  |
      | email_address | test.cucumber@example.com |
      | birthday      | 1990-05-15                |
      | gender        | Female                    |
    And with "address" child entities:
      | street_address   | city       | country     |
      | 123 Main Street  | Auckland   | New Zealand |
      | 456 Queen Street | Wellington | New Zealand |
    When I save the entity
    Then the entity should be saved successfully with a valid UUID
    When I query the "Person" by its ID
    Then the retrieved entity should match:
      | given_name    | Test                      |
      | family_name   | Cucumber                  |
      | email_address | test.cucumber@example.com |
      | birthday      | 1990-05-15                |
      | gender        | Female                    |
    And the retrieved entity should have 2 "address" child records matching:
      | street_address   | city       | country     |
      | 123 Main Street  | Auckland   | New Zealand |
      | 456 Queen Street | Wellington | New Zealand |
    When I update the entity attributes:
      | family_name | Cucumber-Updated |
      | gender      | Male             |
    And I save the entity
    And I query the "Person" by its ID
    Then the retrieved entity should match:
      | given_name    | Test                      |
      | family_name   | Cucumber-Updated          |
      | email_address | test.cucumber@example.com |
      | birthday      | 1990-05-15                |
      | gender        | Male                      |
    And the retrieved entity should have 2 "address" child records matching:
      | street_address   | city       | country     |
      | 123 Main Street  | Auckland   | New Zealand |
      | 456 Queen Street | Wellington | New Zealand |
