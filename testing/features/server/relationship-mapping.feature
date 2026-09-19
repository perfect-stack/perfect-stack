Feature: DataService ManyToOne and OneToOne Relationships
  As an application using nestjs-server
  I want entities with foreign key associations and singular child relations to persist cleanly
  So that ManyToOne and OneToOne relational mappings operate accurately in the database

  Scenario: Create and query entity with ManyToOne reference
    Given a new "Department" entity with the following attributes:
      | name | Engineering |
      | code | ENG         |
    When I save the entity as "engineeringDept"
    Then the entity should be saved successfully with a valid UUID
    Given a new "Person" entity with the following attributes:
      | given_name    | Dave                     |
      | family_name   | Developer                |
      | email_address | dave.developer@dept.com  |
    And I link the entity to "department" "engineeringDept"
    When I save the entity
    Then the entity should be saved successfully with a valid UUID
    When I query the "Person" by its ID
    Then the retrieved entity should match:
      | given_name    | Dave                    |
      | family_name   | Developer               |
      | email_address | dave.developer@dept.com |
    And the retrieved entity should have a "department" child record matching:
      | name | Engineering |
      | code | ENG         |

  Scenario: Create and query entity with OneToOne child relationship
    Given a new "Person" entity with the following attributes:
      | given_name    | Elena                    |
      | family_name   | Explorer                 |
      | email_address | elena.explorer@world.com |
    And with a "passport" child entity:
      | passport_number | NZ987654321 |
      | issuing_country | New Zealand |
    When I save the entity
    Then the entity should be saved successfully with a valid UUID
    When I query the "Person" by its ID
    Then the retrieved entity should match:
      | given_name    | Elena                    |
      | family_name   | Explorer                 |
      | email_address | elena.explorer@world.com |
    And the retrieved entity should have a "passport" child record matching:
      | passport_number | NZ987654321 |
      | issuing_country | New Zealand |
