Feature: QueryService Combined Multi-Criteria Queries
  As an application using nestjs-server
  I want to query entities using multiple criteria chained with AND logic
  So that datasets can be filtered accurately across intersecting attribute constraints

  Background:
    Given the following "Person" records exist:
      | given_name | family_name | email_address             | birthday   | gender |
      | QMC-Alice  | Baker       | qmc.alice.baker@corp.com  | 1985-03-12 | Female |
      | QMC-Amy    | Baker       | qmc.amy.baker@corp.com    | 1992-07-19 | Female |
      | QMC-Alan   | Baker       | qmc.alan.baker@corp.com   | 1988-11-05 | Male   |
      | QMC-Alice  | Clark       | qmc.alice.clark@corp.com  | 1995-01-25 | Female |
      | QMC-Arthur | Clark       | qmc.arthur.clark@corp.com | 1982-09-30 | Male   |

  Scenario: Filter records matching text prefix, exact match, and enum attribute
    When I query "Person" by criteria:
      | name        | operator    | attributeType | value  |
      | given_name  | StartsWith  | Text          | QMC-A  |
      | family_name | Equals      | Text          | Baker  |
      | gender      | Equals      | Enumeration   | Female |
    Then the query response should contain 2 records
    And the query response result list should match:
      | given_name | family_name | email_address            | gender |
      | QMC-Alice  | Baker       | qmc.alice.baker@corp.com | Female |
      | QMC-Amy    | Baker       | qmc.amy.baker@corp.com   | Female |

  Scenario: Filter records matching date range, prefix, and enum criteria
    When I query "Person" by criteria:
      | name       | operator    | attributeType | value      |
      | given_name | StartsWith  | Text          | QMC-       |
      | birthday   | GreaterThan | Date          | 1990-01-01 |
      | gender     | Equals      | Enumeration   | Female     |
    Then the query response should contain 2 records
    And the query response result list should match:
      | given_name | family_name | email_address            | birthday   | gender |
      | QMC-Amy    | Baker       | qmc.amy.baker@corp.com   | 1992-07-19 | Female |
      | QMC-Alice  | Clark       | qmc.alice.clark@corp.com | 1995-01-25 | Female |

  Scenario: Return empty result when combined criteria have no mutual matches
    When I query "Person" by criteria:
      | name       | operator | attributeType | value     |
      | given_name | Equals   | Text          | QMC-Alan  |
      | gender     | Equals   | Enumeration   | Female    |
    Then the query response should contain 0 records
