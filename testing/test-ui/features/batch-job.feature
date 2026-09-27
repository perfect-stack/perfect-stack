Feature: Batch Process Execution and Monitoring
  As a veterinary clinic administrator
  I want to trigger and monitor batch jobs from the Batch Processing UI
  So that background maintenance tasks like the Pet Scan complete reliably and show live progress

  @batch
  Scenario: Execute Pet Scan batch job and verify successful completion
    Given I record the test start time
    When I navigate to "/batch/view"
    Then I should see the "Pet Scan" job in the batch jobs table
    When I execute the "Pet Scan" batch job
    Then the "Execute" button for "Pet Scan" should show a loading spinner
    And the "Pet Scan" job should transition to "Processing"
    Then the "Pet Scan" job should complete successfully within 60 seconds
    And the "Execute" button for "Pet Scan" should return to normal enabled state
    And the "Pet Scan" completedAt timestamp should be greater than the test start time
