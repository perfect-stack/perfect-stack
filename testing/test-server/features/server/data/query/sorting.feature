Feature: QueryService Custom Sorting and Direction
  As an application using nestjs-server
  I want to query entities with custom ordering and direction
  So that records are returned in specified ascending or descending sequences

  Background:
    Given the following "Person" records exist:
      | given_name | family_name | email_address              |
      | QSO-Adam   | Baker       | qso.adam.baker@example.com |
      | QSO-Ben    | Adams       | qso.ben.adams@example.com  |
      | QSO-Clara  | Clark       | qso.clara.clark@example.com|
      | QSO-David  | Adams       | qso.david.adams@example.com|

  Scenario: Sort records ascending by given_name
    When I query "Person" ordered by "given_name" "ASC" by criteria:
      | name       | operator   | attributeType | value |
      | given_name | StartsWith | Text          | QSO-  |
    Then the query response should contain 4 records
    And the query response result list should match:
      | given_name | family_name | email_address              |
      | QSO-Adam   | Baker       | qso.adam.baker@example.com |
      | QSO-Ben    | Adams       | qso.ben.adams@example.com  |
      | QSO-Clara  | Clark       | qso.clara.clark@example.com|
      | QSO-David  | Adams       | qso.david.adams@example.com|

  Scenario: Sort records descending by given_name
    When I query "Person" ordered by "given_name" "DESC" by criteria:
      | name       | operator   | attributeType | value |
      | given_name | StartsWith | Text          | QSO-  |
    Then the query response should contain 4 records
    And the query response result list should match:
      | given_name | family_name | email_address              |
      | QSO-David  | Adams       | qso.david.adams@example.com|
      | QSO-Clara  | Clark       | qso.clara.clark@example.com|
      | QSO-Ben    | Adams       | qso.ben.adams@example.com  |
      | QSO-Adam   | Baker       | qso.adam.baker@example.com |

  Scenario: Sort records ascending by family_name
    When I query "Person" ordered by "family_name" "ASC" by criteria:
      | name       | operator   | attributeType | value |
      | given_name | StartsWith | Text          | QSO-  |
    Then the query response should contain 4 records
    And the query response result list should match:
      | given_name | family_name | email_address              |
      | QSO-Ben    | Adams       | qso.ben.adams@example.com  |
      | QSO-David  | Adams       | qso.david.adams@example.com|
      | QSO-Adam   | Baker       | qso.adam.baker@example.com |
      | QSO-Clara  | Clark       | qso.clara.clark@example.com|
