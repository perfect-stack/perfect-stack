Feature: DataService Sort Index Management
  As an application using nestjs-server
  I want reference data sort indices to be safely swapped and reordered
  So that UI dropdowns and option lists render in predictable, user-configured orders

  Scenario: Swap sort positions of reference data entries
    Given a new "ProjectStatus" entity with the following attributes:
      | name       | Draft |
      | sort_index | 0     |
    When I save the entity
    Given a new "ProjectStatus" entity with the following attributes:
      | name       | Active |
      | sort_index | 1      |
    When I save the entity
    Given a new "ProjectStatus" entity with the following attributes:
      | name       | Completed |
      | sort_index | 2         |
    When I save the entity
    Then the list of "ProjectStatus" in sort order should be:
      | name      | sort_index |
      | Draft     | 0          |
      | Active    | 1          |
      | Completed | 2          |
    When I move "ProjectStatus" with name "Completed" "up"
    Then the list of "ProjectStatus" in sort order should be:
      | name      | sort_index |
      | Draft     | 0          |
      | Completed | 1          |
      | Active    | 2          |
