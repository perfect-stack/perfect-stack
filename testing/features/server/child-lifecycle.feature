Feature: DataService Child Lifecycle and Orphan Removal
  As an application using nestjs-server
  I want child records in OneToMany relationships to be updated, added, or removed automatically
  So that the persistent database state strictly reflects changes to the parent entity graph

  Scenario: Delete child records when removed from parent entity
    Given a new "Person" entity with the following attributes:
      | given_name    | Alice                     |
      | family_name   | Wonder                    |
      | email_address | alice.wonder@example.com  |
    And with "address" child entities:
      | street_address   | city       | country     |
      | 100 First Ave    | London     | UK          |
      | 200 Second Ave   | Manchester | UK          |
      | 300 Third Ave    | Edinburgh  | UK          |
    When I save the entity
    Then the entity should be saved successfully with a valid UUID
    When I query the "Person" by its ID
    Then the retrieved entity should have 3 "address" child records matching:
      | street_address   | city       | country     |
      | 100 First Ave    | London     | UK          |
      | 200 Second Ave   | Manchester | UK          |
      | 300 Third Ave    | Edinburgh  | UK          |
    When I remove child entity "1" from the "address" list
    And I save the entity
    And I query the "Person" by its ID
    Then the retrieved entity should have 2 "address" child records matching:
      | street_address   | city       | country     |
      | 100 First Ave    | London     | UK          |
      | 300 Third Ave    | Edinburgh  | UK          |
    And the removed "Address" entity should not exist in the database
