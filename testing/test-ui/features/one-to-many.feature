Feature: One-to-Many Relationship Layout Rendering
  As a veterinary clinic receptionist
  I want to view a Pet and their associated Vaccinations
  So that the OneToManyControl renders the nested relationship layout seamlessly

  @one-to-many @regression
  Scenario: View Pet and verify nested OneToMany vaccinations table layout
    When I navigate to "/data/Pet/search"
    And I click on the pet row for "Jack"
    Then I should see "Jack" in the "name" field
    And I should see the nested one-to-many "vaccinations" table
    And I should see "Rabies" in the "vaccinations" table
    And I should see "FVRCP" in the "vaccinations" table
