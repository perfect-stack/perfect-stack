Feature: Geometry Datatype Support with SQLite Fallback
  As an application using nestjs-server
  I want to save, update, and retrieve entities with Geometry attributes
  So that spatial data like GeoJSON points and polygons persist cleanly in SQLite test environments

  Scenario: Create and retrieve an entity with a GeoJSON Point
    Given a new "SpatialFeature" entity with the following attributes:
      | name              | Auckland Sanctuary                             |
      | location_geometry | {"type":"Point","coordinates":[174.7633,-36.8485]} |
    When I save the entity
    Then the entity should be saved successfully with a valid UUID
    When I query the "SpatialFeature" by its ID
    Then the retrieved entity should match:
      | name              | Auckland Sanctuary                             |
      | location_geometry | {"type":"Point","coordinates":[174.7633,-36.8485]} |

  Scenario: Update Geometry attribute to a new coordinate
    Given a new "SpatialFeature" entity with the following attributes:
      | name              | Wellington Sanctuary                            |
      | location_geometry | {"type":"Point","coordinates":[174.7762,-41.2865]} |
    When I save the entity
    Then the entity should be saved successfully with a valid UUID
    When I update the entity attributes:
      | location_geometry | {"type":"Point","coordinates":[174.7770,-41.2870]} |
    And I save the entity
    And I query the "SpatialFeature" by its ID
    Then the retrieved entity should match:
      | name              | Wellington Sanctuary                            |
      | location_geometry | {"type":"Point","coordinates":[174.7770,-41.2870]} |

  Scenario: Handle empty and null Geometry attribute
    Given a new "SpatialFeature" entity with the following attributes:
      | name              | Unlocated Site |
      | location_geometry |                |
    When I save the entity
    Then the entity should be saved successfully with a valid UUID
    When I query the "SpatialFeature" by its ID
    Then the retrieved entity should have null or empty "location_geometry"
