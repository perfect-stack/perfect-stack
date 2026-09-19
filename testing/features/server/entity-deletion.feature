Feature: DataService Entity Deletion and Integrity Checks
  As an application using nestjs-server
  I want entities to be safely destroyed when unreferenced and protected when referenced
  So that referential integrity is preserved and orphaned dependencies are prevented

  Scenario: Successfully destroy an entity that has no incoming references
    Given a new "Department" entity with the following attributes:
      | name | Human Resources |
      | code | HR              |
    When I save the entity
    Then the entity should be saved successfully with a valid UUID
    When I destroy the "Department" by its ID
    Then querying "Department" by its ID should throw DataNotFound

  Scenario: Prevent destroy of an entity when referenced by other records
    Given a new "Department" entity with the following attributes:
      | name | Operations |
      | code | OPS        |
    When I save the entity as "opsDept"
    Then the entity should be saved successfully with a valid UUID
    Given a new "Person" entity with the following attributes:
      | given_name    | Fiona               |
      | family_name   | Foreman             |
      | email_address | fiona.ops@corp.com  |
    And I link the entity to "department" "opsDept"
    When I save the entity
    Then the entity should be saved successfully with a valid UUID
    When I attempt to destroy the "Department" "opsDept"
    Then the destroy operation should fail with related entities error
