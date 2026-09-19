Feature: QueryService String Comparison Operators
  As an application using nestjs-server
  I want to query entities using string comparison operators such as Equals, StartsWith, InsensitiveStartsWith, and InsensitiveLike
  So that users can search and filter text fields accurately across case-sensitive and case-insensitive scenarios

  Background:
    Given the following "Person" records exist:
      | given_name | family_name | email_address                |
      | QS-Alice   | Smith       | qs.alice.smith@example.com   |
      | QS-Alicia  | Keys        | qs.alicia.keys@example.com   |
      | QS-Bob     | Builder     | qs.bob.builder@example.com   |
      | QS-Charlie | Chaplin     | qs.charlie.chap@example.com  |

  Scenario: Find exact match using Equals operator
    When I query "Person" by criteria:
      | name          | operator | attributeType | value                      |
      | email_address | Equals   | Text          | qs.alice.smith@example.com |
    Then the query response should contain 1 records
    And the query response result list should match:
      | given_name | family_name | email_address              |
      | QS-Alice   | Smith       | qs.alice.smith@example.com |

  Scenario: Find matches using StartsWith operator
    When I query "Person" by criteria:
      | name       | operator   | attributeType | value  |
      | given_name | StartsWith | Text          | QS-Ali |
    Then the query response should contain 2 records
    And the query response result list should match:
      | given_name | family_name | email_address              |
      | QS-Alice   | Smith       | qs.alice.smith@example.com |
      | QS-Alicia  | Keys        | qs.alicia.keys@example.com |

  Scenario: Find case-insensitive matches using InsensitiveStartsWith operator
    When I query "Person" by criteria:
      | name          | operator              | attributeType | value   |
      | email_address | InsensitiveStartsWith | Text          | QS.BOB. |
    Then the query response should contain 1 records
    And the query response result list should match:
      | given_name | family_name | email_address             |
      | QS-Bob     | Builder     | qs.bob.builder@example.com|

  Scenario: Find substring matches using InsensitiveLike operator
    When I query "Person" by criteria:
      | name        | operator        | attributeType | value |
      | family_name | InsensitiveLike | Text          | uil   |
    Then the query response should contain 1 records
    And the query response result list should match:
      | given_name | family_name | email_address             |
      | QS-Bob     | Builder     | qs.bob.builder@example.com|
