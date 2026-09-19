Feature: QueryService Numeric and Date Range Comparisons
  As an application using nestjs-server
  I want to query entities using comparison operators such as GreaterThan, GreaterThanOrEqualTo, LessThan, and LessThanOrEqualTo
  So that numeric values, sort positions, and dates can be filtered by thresholds and ranges

  Background:
    Given the following "Person" records exist:
      | given_name | family_name | email_address          | birthday   |
      | QR-User80  | Retro       | qr.user80@example.com  | 1980-01-01 |
      | QR-User90  | Classic     | qr.user90@example.com  | 1990-06-15 |
      | QR-User00  | Modern      | qr.user00@example.com  | 2000-12-31 |
      | QR-User10  | Future      | qr.user10@example.com  | 2010-05-20 |

  Scenario: Filter dates using GreaterThan operator
    When I query "Person" by criteria:
      | name       | operator    | attributeType | value      |
      | given_name | StartsWith  | Text          | QR-        |
      | birthday   | GreaterThan | Date          | 1995-01-01 |
    Then the query response should contain 2 records
    And the query response result list should match:
      | given_name | family_name | email_address         | birthday   |
      | QR-User00  | Modern      | qr.user00@example.com | 2000-12-31 |
      | QR-User10  | Future      | qr.user10@example.com | 2010-05-20 |

  Scenario: Filter dates using LessThanOrEqualTo operator
    When I query "Person" by criteria:
      | name       | operator          | attributeType | value      |
      | given_name | StartsWith        | Text          | QR-        |
      | birthday   | LessThanOrEqualTo | Date          | 1990-06-15 |
    Then the query response should contain 2 records
    And the query response result list should match:
      | given_name | family_name | email_address         | birthday   |
      | QR-User80  | Retro       | qr.user80@example.com | 1980-01-01 |
      | QR-User90  | Classic     | qr.user90@example.com | 1990-06-15 |
