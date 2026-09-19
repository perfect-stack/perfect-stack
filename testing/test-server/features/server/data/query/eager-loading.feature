Feature: QueryService Eager Loading and Relation Traversal
  As an application using nestjs-server
  I want to retrieve entities along with their associated relationships using QueryService findOne
  So that nested OneToMany, ManyToOne, and OneToOne entity graphs are fully loaded

  Scenario: Eagerly load OneToMany child relationships
    Given a new "Person" entity with the following attributes:
      | given_name    | QEL-Oliver               |
      | family_name   | OneToMany                |
      | email_address | qel.oliver@relations.com |
    And with "address" child entities:
      | street_address | city       | country     |
      | 10 High Street | Wellington | New Zealand |
      | 20 Low Street  | Auckland   | New Zealand |
    When I save the entity
    Then the entity should be saved successfully with a valid UUID
    When I query the "Person" by its ID
    Then the retrieved entity should match:
      | given_name    | QEL-Oliver               |
      | family_name   | OneToMany                |
      | email_address | qel.oliver@relations.com |
    And the retrieved entity should have 2 "address" child records matching:
      | street_address | city       | country     |
      | 10 High Street | Wellington | New Zealand |
      | 20 Low Street  | Auckland   | New Zealand |

  Scenario: Eagerly load ManyToOne referenced entity
    Given a new "Department" entity with the following attributes:
      | name | QEL-Finance |
      | code | FIN         |
    When I save the entity as "qelFinanceDept"
    Then the entity should be saved successfully with a valid UUID
    Given a new "Person" entity with the following attributes:
      | given_name    | QEL-Manny               |
      | family_name   | ManyToOne               |
      | email_address | qel.manny@relations.com |
    And I link the entity to "department" "qelFinanceDept"
    When I save the entity
    Then the entity should be saved successfully with a valid UUID
    When I query the "Person" by its ID
    Then the retrieved entity should match:
      | given_name    | QEL-Manny               |
      | family_name   | ManyToOne               |
      | email_address | qel.manny@relations.com |
    And the retrieved entity should have a "department" child record matching:
      | name | QEL-Finance |
      | code | FIN         |

  Scenario: Eagerly load OneToOne singular child entity
    Given a new "Person" entity with the following attributes:
      | given_name    | QEL-Una                |
      | family_name   | OneToOne               |
      | email_address | qel.una@relations.com  |
    And with a "passport" child entity:
      | passport_number | QEL-PASS-789 |
      | issuing_country | New Zealand  |
    When I save the entity
    Then the entity should be saved successfully with a valid UUID
    When I query the "Person" by its ID
    Then the retrieved entity should match:
      | given_name    | QEL-Una               |
      | family_name   | OneToOne              |
      | email_address | qel.una@relations.com |
    And the retrieved entity should have a "passport" child record matching:
      | passport_number | QEL-PASS-789 |
      | issuing_country | New Zealand  |

  Scenario: Eagerly load complete composite graph with OneToMany, ManyToOne, and OneToOne
    Given a new "Department" entity with the following attributes:
      | name | QEL-Executive |
      | code | EXEC          |
    When I save the entity as "qelExecDept"
    Then the entity should be saved successfully with a valid UUID
    Given a new "Person" entity with the following attributes:
      | given_name    | QEL-Max                     |
      | family_name   | CompleteGraph               |
      | email_address | qel.max.graph@relations.com |
    And I link the entity to "department" "qelExecDept"
    And with "address" child entities:
      | street_address  | city     | country     |
      | 500 Peak Summit | Queenstown | New Zealand |
    And with a "passport" child entity:
      | passport_number | QEL-PASS-MAX |
      | issuing_country | New Zealand  |
    When I save the entity
    Then the entity should be saved successfully with a valid UUID
    When I query the "Person" by its ID
    Then the retrieved entity should match:
      | given_name    | QEL-Max                     |
      | family_name   | CompleteGraph               |
      | email_address | qel.max.graph@relations.com |
    And the retrieved entity should have a "department" child record matching:
      | name | QEL-Executive |
      | code | EXEC          |
    And the retrieved entity should have 1 "address" child records matching:
      | street_address  | city       | country     |
      | 500 Peak Summit | Queenstown | New Zealand |
    And the retrieved entity should have a "passport" child record matching:
      | passport_number | QEL-PASS-MAX |
      | issuing_country | New Zealand  |
