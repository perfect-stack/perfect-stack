Feature: Tree-based Taxonomic Species Management
  As a veterinary clinic and species registry administrator
  I want species to be organized in a taxonomic tree hierarchy
  So that scientific names, ranks, and parent-child relationships maintain integrity and support ancestry breadcrumb queries

  # Scenarios cover:
  # 1. Loading full taxonomic tree from root (Animalia)
  # 2. Loading subtree with depth limit
  # 3. Ancestor / breadcrumb path query from species to root
  # 4. Pagination of direct child taxa
  # 5. Single-node saves without cascade mutation
  # 6. Singular root constraint enforcement
  # 7. Mandatory parent validation for non-root taxa
  # 8. Valid reparenting
  # 9. Cycle prevention during reparenting
  # 10. Leaf-only deletion enforcement

  Scenario: Verify full taxonomic tree query from root Animalia
    Given a populated taxonomic "Species" tree containing Mammals, Birds, and Fish
    When I query the tree for "Species"
    Then the root node should have scientific_name "Animalia" and rank "Kingdom"
    And the root node should have 1 children: "Chordata"

  Scenario: Query subtree with depth limit
    Given a populated taxonomic "Species" tree containing Mammals, Birds, and Fish
    When I query the subtree for "Species" starting at "Chordata" with depth 1
    Then the subtree root should have scientific_name "Chordata" and rank "Phylum"
    And the subtree root should have 3 children: "Mammalia", "Aves", "Actinopterygii"
    And the child "Mammalia" should have 0 nested children loaded

  Scenario: Query ancestors breadcrumb chain from species to root
    Given a populated taxonomic "Species" tree containing Mammals, Birds, and Fish
    When I query ancestors for "Species" with scientific name "Canis familiaris"
    Then the ancestor chain from root to leaf should be:
      | scientific_name  | rank    |
      | Animalia         | Kingdom |
      | Chordata         | Phylum  |
      | Mammalia         | Class   |
      | Carnivora        | Order   |
      | Canidae          | Family  |
      | Canis            | Genus   |
      | Canis familiaris | Species |

  Scenario: Query paginated direct children of a parent taxon
    Given a populated taxonomic "Species" tree containing Mammals, Birds, and Fish
    When I query children for "Species" parent "Chordata" page 1 size 2
    Then the child page should contain 2 items with totalCount 3
    When I query children for "Species" parent "Chordata" page 2 size 2
    Then the child page should contain 1 items with totalCount 3

  Scenario: Single-node save updates taxon without cascade mutating children
    Given a populated taxonomic "Species" tree containing Mammals, Birds, and Fish
    When I update "Species" node "Mammalia" attribute "common_name" to "Warm-blooded Mammals"
    Then the node "Mammalia" attribute "common_name" should be "Warm-blooded Mammals"
    And the child nodes under "Mammalia" should remain intact

  Scenario: Enforce singular root taxon per tree
    Given a populated taxonomic "Species" tree containing Mammals, Birds, and Fish
    When I attempt to create a second root "Species" entity with scientific_name "Plantae" and rank "Kingdom"
    Then the save operation should fail with an error containing "root entity already exists"

  Scenario: Prevent non-root taxon creation without an existing parent
    Given a populated taxonomic "Species" tree containing Mammals, Birds, and Fish
    When I attempt to create a "Species" entity with scientific_name "Orphanus" and non-existent parent
    Then the save operation should fail with an error containing "does not exist"

  Scenario: Support valid reparenting of a taxon
    Given a populated taxonomic "Species" tree containing Mammals, Birds, and Fish
    When I reparent "Species" node "Psittaciformes" to "Chordata"
    Then the node "Psittaciformes" parent should be "Chordata"

  Scenario: Prevent cycles during reparenting
    Given a populated taxonomic "Species" tree containing Mammals, Birds, and Fish
    When I attempt to reparent "Species" node "Chordata" to its descendant "Canis familiaris"
    Then the save operation should fail with an error containing "cycle detected"

  Scenario: Prevent deletion of non-leaf taxa
    Given a populated taxonomic "Species" tree containing Mammals, Birds, and Fish
    When I attempt to delete "Species" node "Mammalia"
    Then the delete operation should fail with an error containing "child nodes"

  Scenario: Allow deletion of leaf species
    Given a populated taxonomic "Species" tree containing Mammals, Birds, and Fish
    When I delete leaf "Species" node "Carassius auratus"
    Then the node "Carassius auratus" should no longer exist
