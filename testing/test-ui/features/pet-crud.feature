Feature: Pet Management CRUD Lifecycle
  As a veterinary clinic receptionist
  I want to manage pets in the clinic registry
  So that I can create, view, update, and delete pet records through the UI

  @crud
  Scenario: Create, read, update, and delete a Pet record
    Given a species "Canis familiaris" exists in the registry
    When I navigate to "/data/Pet/search"
    And I click the "Add Pet" button
    And I enter "Barnaby" into the "name" field
    And I select "Canis familiaris" from the "species" dropdown
    And I enter "Golden Retriever" into the "breed" field
    And I enter "CHIP-98765" into the "microchip_number" field
    And I click the "Save details" button
    Then I should see a success toast "Save is successful"
    And I should see "Barnaby" in the "name" field
    And I should see "Canis familiaris" in the "species" field
    And I should see "Golden Retriever" in the "breed" field

    When I click the "Edit Pet" button
    And I enter "Barnaby - Champion" into the "name" field
    And I enter "Labrador Retriever" into the "breed" field
    And I click the "Save details" button
    Then I should see a success toast "Save is successful"
    And I should see "Barnaby - Champion" in the "name" field
    And I should see "Labrador Retriever" in the "breed" field

    When I click the "Edit Pet" button
    And I click the "Delete" button
    And I confirm the deletion dialog
    Then I should be on the search page
    And I should not see "Barnaby - Champion" in the search results table
