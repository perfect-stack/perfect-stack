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

  Scenario: Successfully perform destroy check and destroy on entity targeted by OneToMany relationship
    Given a new "Address" entity with the following attributes:
      | street_address | 100 Queen Street |
      | city           | Auckland         |
      | country        | New Zealand      |
    When I save the entity as "standaloneAddress"
    Then the entity should be saved successfully with a valid UUID
    When I perform a destroy check on "Address" "standaloneAddress"
    Then the destroy check should be allowed
    When I attempt to destroy the "Address" "standaloneAddress"
    Then querying "Address" by its ID should throw DataNotFound

  Scenario: Prevent destroy of an entity when referenced by OneToOne relationship
    Given a new "Passport" entity with the following attributes:
      | passport_number | NZ11223344  |
      | issuing_country | New Zealand |
    When I save the entity as "personPassport"
    Then the entity should be saved successfully with a valid UUID
    Given a new "Person" entity with the following attributes:
      | given_name    | Peter                  |
      | family_name   | PassportOwner          |
      | email_address | peter.pass@example.com |
    And I link the entity to "passport" "personPassport"
    When I save the entity
    Then the entity should be saved successfully with a valid UUID
    When I perform a destroy check on "Passport" "personPassport"
    Then the destroy check should be disallowed
    When I attempt to destroy the "Passport" "personPassport"
    Then the destroy operation should fail with related entities error
