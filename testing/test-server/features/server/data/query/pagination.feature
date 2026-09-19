Feature: QueryService Pagination and Offset Navigation
  As an application using nestjs-server
  I want to query entities with pagination parameters like pageNumber and pageSize
  So that frontend data tables can request specific slices and total count metadata

  Background:
    Given the following "Person" records exist:
      | given_name   | family_name | email_address          |
      | QPG-User-01  | Alpha       | qpg.user01@example.com |
      | QPG-User-02  | Bravo       | qpg.user02@example.com |
      | QPG-User-03  | Charlie     | qpg.user03@example.com |
      | QPG-User-04  | Delta       | qpg.user04@example.com |
      | QPG-User-05  | Echo        | qpg.user05@example.com |
      | QPG-User-06  | Foxtrot     | qpg.user06@example.com |

  Scenario: Retrieve first page with limit and deterministic ordering
    When I query "Person" page 1 of size 2 ordered by "given_name" "ASC" by criteria:
      | name       | operator   | attributeType | value |
      | given_name | StartsWith | Text          | QPG-  |
    Then the query response total count should be 6
    And the query response should contain 2 records
    And the query response result list should match:
      | given_name  | family_name | email_address          |
      | QPG-User-01 | Alpha       | qpg.user01@example.com |
      | QPG-User-02 | Bravo       | qpg.user02@example.com |

  Scenario: Retrieve second page with offset
    When I query "Person" page 2 of size 2 ordered by "given_name" "ASC" by criteria:
      | name       | operator   | attributeType | value |
      | given_name | StartsWith | Text          | QPG-  |
    Then the query response total count should be 6
    And the query response should contain 2 records
    And the query response result list should match:
      | given_name  | family_name | email_address          |
      | QPG-User-03 | Charlie     | qpg.user03@example.com |
      | QPG-User-04 | Delta       | qpg.user04@example.com |

  Scenario: Retrieve third page
    When I query "Person" page 3 of size 2 ordered by "given_name" "ASC" by criteria:
      | name       | operator   | attributeType | value |
      | given_name | StartsWith | Text          | QPG-  |
    Then the query response total count should be 6
    And the query response should contain 2 records
    And the query response result list should match:
      | given_name  | family_name | email_address          |
      | QPG-User-05 | Echo        | qpg.user05@example.com |
      | QPG-User-06 | Foxtrot     | qpg.user06@example.com |

  Scenario: Request page beyond dataset range
    When I query "Person" page 4 of size 2 ordered by "given_name" "ASC" by criteria:
      | name       | operator   | attributeType | value |
      | given_name | StartsWith | Text          | QPG-  |
    Then the query response total count should be 6
    And the query response should contain 0 records
