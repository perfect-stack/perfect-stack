Feature: DataService and QueryService Tree Structure Relationship
  As an application using nestjs-server
  I want self-referencing tree relationships to be strictly managed and traversed
  So that hierarchical domains like organisational units can maintain integrity, prevent cycles, and support deep or breadcrumb queries

  # Scenarios cover:
  # 1. Loading full tree structure
  # 2. Loading subtree with depth limits
  # 3. Ancestor / breadcrumb path query from leaf to root
  # 4. Pagination of direct child nodes
  # 5. Single-node saves without cascade mutation
  # 6. Singular root constraint enforcement
  # 7. Mandatory parent validation for non-root entities
  # 8. Valid reparenting
  # 9. Cycle prevention during reparenting
  # 10. Leaf-only deletion enforcement

  Scenario: Verify full organisation tree query from root
    Given a populated organisational "OrganisationUnit" tree containing Engineering, Operations, and Sales divisions
    When I query the tree for "OrganisationUnit"
    Then the root node should have name "Global Enterprise" and unit_type "Headquarters"
    And the root node should have 3 children: "Engineering Division", "Operations Division", "Sales Division"

  Scenario: Query subtree with depth limit
    Given a populated organisational "OrganisationUnit" tree containing Engineering, Operations, and Sales divisions
    When I query the subtree for "OrganisationUnit" starting at "Engineering Division" with depth 1
    Then the subtree root should have name "Engineering Division" and unit_type "Division"
    And the subtree root should have 3 children: "Software Development", "Infrastructure & Cloud", "Quality Assurance"
    And the child "Software Development" should have 0 nested children loaded

  Scenario: Query ancestors breadcrumb chain from leaf to root
    Given a populated organisational "OrganisationUnit" tree containing Engineering, Operations, and Sales divisions
    When I query ancestors for "OrganisationUnit" with name "Backend Platform Team"
    Then the ancestor chain from root to leaf should be:
      | name                   | unit_type    |
      | Global Enterprise      | Headquarters |
      | Engineering Division   | Division     |
      | Software Development   | Department   |
      | Backend Platform Team  | Team         |

  Scenario: Query paginated direct children of a parent node
    Given a populated organisational "OrganisationUnit" tree containing Engineering, Operations, and Sales divisions
    When I query children for "OrganisationUnit" parent "Engineering Division" page 1 size 2
    Then the child page should contain 2 items with totalCount 3
    When I query children for "OrganisationUnit" parent "Engineering Division" page 2 size 2
    Then the child page should contain 1 items with totalCount 3

  Scenario: Single-node save updates node without cascade mutating children
    Given a populated organisational "OrganisationUnit" tree containing Engineering, Operations, and Sales divisions
    When I update "OrganisationUnit" node "Software Development" attribute "code" to "DEV-CORE"
    Then the node "Software Development" attribute "code" should be "DEV-CORE"
    And the child nodes under "Software Development" should remain intact

  Scenario: Enforce singular root entity per tree
    Given a populated organisational "OrganisationUnit" tree containing Engineering, Operations, and Sales divisions
    When I attempt to create a second root "OrganisationUnit" entity with name "Another Global Corp" and unit_type "Headquarters"
    Then the save operation should fail with an error containing "root entity already exists"

  Scenario: Prevent non-root node creation without an existing parent
    Given a populated organisational "OrganisationUnit" tree containing Engineering, Operations, and Sales divisions
    When I attempt to create a "OrganisationUnit" entity with name "Orphan Team" and non-existent parent
    Then the save operation should fail with an error containing "does not exist"

  Scenario: Support valid reparenting
    Given a populated organisational "OrganisationUnit" tree containing Engineering, Operations, and Sales divisions
    When I reparent "OrganisationUnit" node "Quality Assurance" to "Operations Division"
    Then the node "Quality Assurance" parent should be "Operations Division"

  Scenario: Prevent cycles during reparenting
    Given a populated organisational "OrganisationUnit" tree containing Engineering, Operations, and Sales divisions
    When I attempt to reparent "OrganisationUnit" node "Engineering Division" to its descendant "Backend Platform Team"
    Then the save operation should fail with an error containing "cycle detected"

  Scenario: Prevent deletion of non-leaf nodes
    Given a populated organisational "OrganisationUnit" tree containing Engineering, Operations, and Sales divisions
    When I attempt to delete "OrganisationUnit" node "Engineering Division"
    Then the delete operation should fail with an error containing "child nodes"

  Scenario: Allow deletion of leaf node
    Given a populated organisational "OrganisationUnit" tree containing Engineering, Operations, and Sales divisions
    When I delete leaf "OrganisationUnit" node "Backend Platform Team"
    Then the node "Backend Platform Team" should no longer exist
