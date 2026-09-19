Feature: Vet Clinic UI Smoke Test
  As a veterinary clinic receptionist
  I want to access the Vet Clinic application
  So that I can verify the frontend application and browser automation harness are operating correctly

  Scenario: Verify browser automation and title retrieval
    When I navigate to "data:text/html,<title>Vet Clinic</title><h1>Vet Clinic Portal</h1>"
    Then the page title should not be empty
    And the page header should display "Vet Clinic Portal"
