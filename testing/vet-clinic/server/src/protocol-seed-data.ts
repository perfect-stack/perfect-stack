import { INestApplicationContext, Logger } from '@nestjs/common';
import { DataService, OrmService } from '@perfect-stack/nestjs-server';

export interface SeedAssertionType {
  assertion_type_name: string;
  assertion_unit?: string;
  assertion_value_class: "Integer" | "Double" | "Text" | "Enumeration" | "Date" | "Time" | "DateTime" | "Geometry" | "Boolean";
  assertion_value_enum_options?: string;
  assertion_value_number_min?: number;
  assertion_value_number_max?: number;
  assertion_value_decimal_places?: number;
  assertion_method?: string;
  assertion_type_notes?: string;
}

export interface SeedActivityTemplate {
  activity_template_name: string;
  assertion_types: SeedAssertionType[];
}

export interface SeedProtocol {
  protocol_name: string;
  activity_templates: SeedActivityTemplate[];
}

export const GENERAL_SEED_ASSERTION_TYPES: SeedAssertionType[] = [
  {
    assertion_type_name: "Sex",
    assertion_unit: "",
    assertion_value_class: "Enumeration",
    assertion_value_enum_options: "Female | Male | Hermaphrodite | Undetermined",
    assertion_type_notes: "The sex of the biological individual(s) represented in the Occurrence (Darwin Core term: sex).",
  },
  {
    assertion_type_name: "Life Stage",
    assertion_unit: "",
    assertion_value_class: "Enumeration",
    assertion_value_enum_options: "Adult | Subadult | Juvenile | Larva | Egg | Nymph | Pupa",
    assertion_type_notes: "The age class or life stage of the biological individual(s) at the time the Occurrence was recorded (Darwin Core term: lifeStage).",
  },
  {
    assertion_type_name: "Reproductive Condition",
    assertion_unit: "",
    assertion_value_class: "Enumeration",
    assertion_value_enum_options: "Non-reproductive | Breeding | Gravid | Pregnant | Lactating | Courting | In bloom | Fruiting",
    assertion_type_notes: "The reproductive condition of the individual(s) or colony observed (Darwin Core term: reproductiveCondition).",
  },
  {
    assertion_type_name: "Total Length",
    assertion_unit: "mm",
    assertion_value_class: "Double",
    assertion_value_number_min: 0.1,
    assertion_value_number_max: 50000,
    assertion_value_decimal_places: 1,
    assertion_method: "Caliper / measuring tape",
    assertion_type_notes: "Total length from anterior-most point to posterior-most point (Darwin Core MeasurementOrFact: total length).",
  },
  {
    assertion_type_name: "Behavior",
    assertion_unit: "",
    assertion_value_class: "Text",
    assertion_type_notes: "Observed behavior or activity at the time of encounter, e.g. foraging, roosting, calling, territorial display (Darwin Core term: behavior).",
  },
  {
    assertion_type_name: "Tagged or Banded",
    assertion_unit: "",
    assertion_value_class: "Boolean",
    assertion_type_notes: "Indicates whether the observed animal had a physical marker, leg band, wing tag, or PIT tag attached.",
  },
  {
    assertion_type_name: "Ambient Temperature",
    assertion_unit: "°C",
    assertion_value_class: "Double",
    assertion_value_number_min: -50,
    assertion_value_number_max: 60,
    assertion_value_decimal_places: 1,
    assertion_method: "Field thermometer",
    assertion_type_notes: "Ambient air or water temperature recorded at the occurrence site during observation.",
  },
  {
    assertion_type_name: "Identification Date Time",
    assertion_unit: "",
    assertion_value_class: "DateTime",
    assertion_method: "Expert morphological determination",
    assertion_type_notes: "The date and time on which the subject was determined or verified to represent the Taxon (Darwin Core term: dateIdentified).",
  },
  {
    assertion_type_name: "Spatial Footprint",
    assertion_unit: "",
    assertion_value_class: "Geometry",
    assertion_method: "Field GPS boundary mapping / polygon capture",
    assertion_type_notes: "A polygon or multipolygon geometry defining the search plot boundary, quadrat, or survey area encompassing the occurrence (Darwin Core term: footprintWKT).",
  },
];

export const SEED_PROTOCOLS: SeedProtocol[] = [
  {
    protocol_name: "Bird Capture",
    activity_templates: [
      {
        activity_template_name: "Capture detail",
        assertion_types: [
          {
            assertion_type_name: "Capture technique",
            assertion_value_class: "Text",
            assertion_type_notes: "Technique used to capture the bird",
          },
        ],
      },
      {
        activity_template_name: "Marking by Banding",
        assertion_types: [
          {
            assertion_type_name: "Band number",
            assertion_value_class: "Text",
            assertion_type_notes: "Unique identifier on the metal or plastic bird band",
          },
          {
            assertion_type_name: "Band colour",
            assertion_value_class: "Text",
            assertion_type_notes: "Primary colour of the band",
          },
          {
            assertion_type_name: "Band location",
            assertion_value_class: "Text",
            assertion_type_notes: "Leg or position where band was placed (e.g. Left tarsus, Right tarsus)",
          },
          {
            assertion_type_name: "Colour band",
            assertion_value_class: "Text",
            assertion_type_notes: "Colour combination band code",
          },
          {
            assertion_type_name: "Removed band",
            assertion_value_class: "Text",
            assertion_type_notes: "Details of any previously attached band removed during handling",
          },
        ],
      },
      {
        activity_template_name: "Marking by Microchip",
        assertion_types: [
          {
            assertion_type_name: "Microchip",
            assertion_value_class: "Text",
            assertion_type_notes: "Electronic RFID / PIT tag transponder number",
          },
        ],
      },
      {
        activity_template_name: "Marking by Wing Tag",
        assertion_types: [
          {
            assertion_type_name: "Wing Tag",
            assertion_value_class: "Text",
            assertion_type_notes: "Visual patagial wing tag code or colour",
          },
        ],
      },
      {
        activity_template_name: "Sample Taken",
        assertion_types: [
          {
            assertion_type_name: "Sample Type",
            assertion_value_class: "Text",
            assertion_type_notes: "Biological specimen type (e.g. Blood, Feather, Swab, Feces)",
          },
          {
            assertion_type_name: "Sample Value",
            assertion_value_class: "Text",
            assertion_type_notes: "Sample measurement or reading value",
          },
          {
            assertion_type_name: "Sample Unit",
            assertion_value_class: "Text",
            assertion_type_notes: "Unit of measurement for the sample",
          },
          {
            assertion_type_name: "Sample Notes",
            assertion_value_class: "Text",
            assertion_type_notes: "Collection notes, storage buffer, or lab tracking code",
          },
        ],
      },
      {
        activity_template_name: "Mortality by Capture",
        assertion_types: [
          {
            assertion_type_name: "Field sign descripton",
            assertion_value_class: "Text",
            assertion_type_notes: "Description of field signs associated with mortality",
          },
          {
            assertion_type_name: "Diagnosis",
            assertion_value_class: "Text",
            assertion_type_notes: "Field assessment of cause of mortality",
          },
          {
            assertion_type_name: "Predator type (LIST)",
            assertion_value_class: "Enumeration",
            assertion_value_enum_options: "Mustelid (Stoat/Ferret/Weasel) | Feral Cat | Possum | Rat | Raptor | Dog | Unknown",
            assertion_type_notes: "Suspected or verified predator type",
          },
        ],
      },
    ],
  },
  {
    protocol_name: "Bird Sighting",
    activity_templates: [
      {
        activity_template_name: "Bird Sighting detail",
        assertion_types: [
          {
            assertion_type_name: "Sighting Method",
            assertion_value_class: "Enumeration",
            assertion_value_enum_options: "Visual | Machine",
            assertion_type_notes: "Method used to make the sighting observation",
          },
          {
            assertion_type_name: "Sighting Technique",
            assertion_value_class: "Enumeration",
            assertion_value_enum_options: "Transmitter | Sensor RFID | Camera | AARD | Audio",
            assertion_type_notes: "Technique or sensor device used to detect the bird",
          },
          {
            assertion_type_name: "Status",
            assertion_value_class: "Enumeration",
            assertion_value_enum_options: "Alive | Dead | Unknown",
            assertion_type_notes: "Observed vital status of the bird",
          },
        ],
      },
    ],
  },
  {
    protocol_name: "Bird Nest Monitoring",
    activity_templates: [
      {
        activity_template_name: "Nest Visit",
        assertion_types: [
          {
            assertion_type_name: "Brood number",
            assertion_value_class: "Integer",
            assertion_type_notes: "Sequential brood number for the breeding pair this season",
          },
          {
            assertion_type_name: "Egg count",
            assertion_value_class: "Integer",
            assertion_value_number_min: 0,
            assertion_type_notes: "Number of intact eggs in the nest",
          },
          {
            assertion_type_name: "Chick count",
            assertion_value_class: "Integer",
            assertion_value_number_min: 0,
            assertion_type_notes: "Number of hatched chicks present in the nest",
          },
          {
            assertion_type_name: "Nest status type",
            assertion_value_class: "Enumeration",
            assertion_value_enum_options: "Active - Eggs | Active - Chicks | Fledged | Failed | Inactive / Abandoned",
            assertion_type_notes: "Overall nest status at time of visit",
          },
          {
            assertion_type_name: "Nest failure reason",
            assertion_value_class: "Text",
            assertion_type_notes: "Identified cause of failure if nest failed (e.g. Predation, Desertion, Weather)",
          },
          {
            assertion_type_name: "Nest notes",
            assertion_value_class: "Text",
            assertion_type_notes: "General observation notes during nest check",
          },
        ],
      },
      {
        activity_template_name: "Egg Status",
        assertion_types: [
          {
            assertion_type_name: "Egg id",
            assertion_value_class: "Text",
            assertion_type_notes: "Individual egg marker or label (e.g. A, B, C)",
          },
          {
            assertion_type_name: "Egg status",
            assertion_value_class: "Enumeration",
            assertion_value_enum_options: "Intact | Piiping | Hatched | Broken | Infertile / Addled | Missing",
            assertion_type_notes: "Developmental or physical status of the egg",
          },
          {
            assertion_type_name: "Egg weight",
            assertion_unit: "g",
            assertion_value_class: "Double",
            assertion_value_number_min: 0.1,
            assertion_value_decimal_places: 2,
            assertion_type_notes: "Measured mass of the egg in grams",
          },
        ],
      },
    ],
  },
  {
    protocol_name: "Five Minute Bird Count (5MBC)",
    activity_templates: [
      {
        activity_template_name: "Count Detection Detail",
        assertion_types: [
          {
            assertion_type_name: "Detection cue",
            assertion_value_class: "Enumeration",
            assertion_value_enum_options: "Seen | Heard | Both",
            assertion_type_notes: "Primary sensory cue for detection",
          },
          {
            assertion_type_name: "Vocalisation type",
            assertion_value_class: "Enumeration",
            assertion_value_enum_options: "Song | Contact call | Alarm call | Non-vocal sound",
            assertion_type_notes: "Type of vocalisation or acoustic cue heard",
          },
          {
            assertion_type_name: "Distance band",
            assertion_value_class: "Enumeration",
            assertion_value_enum_options: "<25m | 25-100m | >100m | Outside station",
            assertion_type_notes: "Estimated distance band from the count station",
          },
          {
            assertion_type_name: "Radial distance",
            assertion_unit: "m",
            assertion_value_class: "Double",
            assertion_value_number_min: 0,
            assertion_type_notes: "Estimated meters from observer to bird",
          },
          {
            assertion_type_name: "Compass bearing",
            assertion_unit: "deg",
            assertion_value_class: "Double",
            assertion_value_number_min: 0,
            assertion_value_number_max: 360,
            assertion_type_notes: "Degrees 0-360 from station to detection",
          },
          {
            assertion_type_name: "Height stratum",
            assertion_value_class: "Enumeration",
            assertion_value_enum_options: "Ground | Understorey | Subcanopy | Canopy | Emergent | Aerial",
            assertion_type_notes: "Forest vegetation vertical stratum where bird was detected",
          },
          {
            assertion_type_name: "Individual count",
            assertion_value_class: "Integer",
            assertion_value_number_min: 1,
            assertion_type_notes: "Integer count of individuals in cluster",
          },
          {
            assertion_type_name: "Flock association",
            assertion_value_class: "Enumeration",
            assertion_value_enum_options: "Single | Pair | Family group | Mixed flock",
            assertion_type_notes: "Social grouping or flock association",
          },
        ],
      },
      {
        activity_template_name: "Count Environmental Conditions",
        assertion_types: [
          {
            assertion_type_name: "Wind strength",
            assertion_value_class: "Enumeration",
            assertion_value_enum_options: "0 - Calm | 1 - Light air | 2 - Light breeze | 3 - Gentle breeze | 4 - Moderate breeze | 5 - Fresh breeze",
            assertion_type_notes: "Wind strength on Beaufort scale 0-5",
          },
          {
            assertion_type_name: "Rain score",
            assertion_value_class: "Enumeration",
            assertion_value_enum_options: "None | Mist | Drizzle | Light | Moderate",
            assertion_type_notes: "Precipitation score during count",
          },
          {
            assertion_type_name: "Ambient noise score",
            assertion_value_class: "Enumeration",
            assertion_value_enum_options: "0 = Silent | 1 = Low | 2 = Moderate | 3 = Loud/interfering",
            assertion_type_notes: "Ambient noise score (0 = Silent, 1 = Low, 2 = Moderate, 3 = Loud/interfering)",
          },
          {
            assertion_type_name: "Sun/Cloud cover percentage",
            assertion_unit: "%",
            assertion_value_class: "Double",
            assertion_value_number_min: 0,
            assertion_value_number_max: 100,
            assertion_type_notes: "Cloud cover percentage across the visible sky",
          },
          {
            assertion_type_name: "Temperature estimate",
            assertion_unit: "°C",
            assertion_value_class: "Double",
            assertion_type_notes: "Estimated ambient air temperature in degrees Celsius",
          },
        ],
      },
      {
        activity_template_name: "Bird Behaviour",
        assertion_types: [
          {
            assertion_type_name: "Activity at detection",
            assertion_value_class: "Enumeration",
            assertion_value_enum_options: "Perched | Foraging | Roosting | Flying through | Territorial display",
            assertion_type_notes: "Observed behavioral activity at initial detection",
          },
          {
            assertion_type_name: "Substrate",
            assertion_value_class: "Enumeration",
            assertion_value_enum_options: "Trunk | Branch | Foliage | Ground | Water | Artificial structure",
            assertion_type_notes: "Physical substrate where the bird was observed",
          },
        ],
      },
    ],
  },
  {
    protocol_name: "Bird Mist Netting",
    activity_templates: [
      {
        activity_template_name: "Net Deployment & Extraction",
        assertion_types: [
          {
            assertion_type_name: "Net station ID",
            assertion_value_class: "Text",
            assertion_type_notes: "Identifier code of the mist net station",
          },
          {
            assertion_type_name: "Net mesh size",
            assertion_unit: "mm",
            assertion_value_class: "Text",
            assertion_type_notes: "Mist net mesh size (e.g., 30mm, 36mm)",
          },
          {
            assertion_type_name: "Shelf position",
            assertion_value_class: "Enumeration",
            assertion_value_enum_options: "Shelf 1 (top) | Shelf 2 | Shelf 3 | Shelf 4 | Shelf 5 (bottom)",
            assertion_type_notes: "Vertical net shelf pocket where bird was captured (Shelf 1 [top] to Shelf 4/5 [bottom])",
          },
          {
            assertion_type_name: "Extraction time",
            assertion_value_class: "Time",
            assertion_type_notes: "Time the bird was extracted from the mist net",
          },
          {
            assertion_type_name: "Entanglement severity",
            assertion_value_class: "Enumeration",
            assertion_value_enum_options: "Light | Moderate | Severe/pocketed",
            assertion_type_notes: "Severity degree of net pocket entanglement",
          },
          {
            assertion_type_name: "Capture orientation",
            assertion_value_class: "Text",
            assertion_type_notes: "Direction bird entered net (Facing north, Facing south, etc.)",
          },
        ],
      },
      {
        activity_template_name: "Avian Morphometrics",
        assertion_types: [
          {
            assertion_type_name: "Wing chord length",
            assertion_unit: "mm",
            assertion_value_class: "Double",
            assertion_value_number_min: 1,
            assertion_value_decimal_places: 1,
            assertion_type_notes: "Maximum flattened or natural chord in mm",
          },
          {
            assertion_type_name: "Tail length",
            assertion_unit: "mm",
            assertion_value_class: "Double",
            assertion_value_number_min: 1,
            assertion_value_decimal_places: 1,
            assertion_type_notes: "Tail length from base to tip of longest rectrix in mm",
          },
          {
            assertion_type_name: "Tarsus length",
            assertion_unit: "mm",
            assertion_value_class: "Double",
            assertion_value_number_min: 1,
            assertion_value_decimal_places: 1,
            assertion_type_notes: "Standard or minimum tarsus length in mm",
          },
          {
            assertion_type_name: "Culmen length",
            assertion_unit: "mm",
            assertion_value_class: "Double",
            assertion_value_number_min: 0.1,
            assertion_value_decimal_places: 1,
            assertion_type_notes: "Total culmen or exposed culmen in mm",
          },
          {
            assertion_type_name: "Bill depth",
            assertion_unit: "mm",
            assertion_value_class: "Double",
            assertion_value_number_min: 0.1,
            assertion_value_decimal_places: 1,
            assertion_type_notes: "Bill depth in mm at anterior edge of nostrils",
          },
          {
            assertion_type_name: "Total head length",
            assertion_unit: "mm",
            assertion_value_class: "Double",
            assertion_value_number_min: 1,
            assertion_value_decimal_places: 1,
            assertion_type_notes: "Bill tip to back of skull in mm",
          },
          {
            assertion_type_name: "Body Mass",
            assertion_unit: "g",
            assertion_value_class: "Double",
            assertion_value_number_min: 0.1,
            assertion_value_decimal_places: 1,
            assertion_method: "Electronic balance",
            assertion_type_notes: "Total body mass in grams, measured to nearest 0.1g",
          },
        ],
      },
      {
        activity_template_name: "Condition & Ageing",
        assertion_types: [
          {
            assertion_type_name: "Furcular fat score",
            assertion_value_class: "Enumeration",
            assertion_value_enum_options: "0 | 1 | 2 | 3 | 4 | 5",
            assertion_type_notes: "Furcular fat deposit score on 0 to 5 scale",
          },
          {
            assertion_type_name: "Pectoral muscle condition",
            assertion_value_class: "Enumeration",
            assertion_value_enum_options: "0 - Concave/emaciated | 1 - Slightly concave | 2 - Flat | 3 - Full/convex",
            assertion_type_notes: "Pectoral muscle condition (0 = Concave/emaciated to 3 = Full/convex)",
          },
          {
            assertion_type_name: "Brood patch score",
            assertion_value_class: "Enumeration",
            assertion_value_enum_options: "0 - None | 1 - Loss of down | 2 - Vascularised | 3 - Wrinkled | 4 - Regrowth",
            assertion_type_notes: "Brood patch score (0 = None, 1 = Loss of down, 2 = Vascularised, 3 = Wrinkled, 4 = Regrowth)",
          },
          {
            assertion_type_name: "Flight feather moult stage",
            assertion_value_class: "Enumeration",
            assertion_value_enum_options: "None | Active | Suspended | Completed",
            assertion_type_notes: "Flight feather moult stage",
          },
          {
            assertion_type_name: "Primary feather wear",
            assertion_value_class: "Enumeration",
            assertion_value_enum_options: "0 - Fresh | 1 - Slight | 2 - Moderate | 3 - Heavy | 4 - Heavily abraded",
            assertion_type_notes: "Primary feather wear score (0 = Fresh to 4 = Heavily abraded)",
          },
          {
            assertion_type_name: "Skull ossification",
            assertion_unit: "%",
            assertion_value_class: "Double",
            assertion_value_number_min: 0,
            assertion_value_number_max: 100,
            assertion_type_notes: "Percentage of skull ossification (0-100%)",
          },
          {
            assertion_type_name: "Iris colour",
            assertion_value_class: "Text",
            assertion_type_notes: "Eye / iris colour as an age-class indicator",
          },
        ],
      },
      {
        activity_template_name: "Avian Health & Welfare",
        assertion_types: [
          {
            assertion_type_name: "Stress sign observed",
            assertion_value_class: "Enumeration",
            assertion_value_enum_options: "None | Panting | Lethargy | Wing droop",
            assertion_type_notes: "Handling stress signs observed",
          },
          {
            assertion_type_name: "Holding duration",
            assertion_unit: "min",
            assertion_value_class: "Double",
            assertion_value_number_min: 0,
            assertion_type_notes: "Minutes in cloth bag before release",
          },
          {
            assertion_type_name: "Release condition",
            assertion_value_class: "Enumeration",
            assertion_value_enum_options: "Strong flight | Weak flight | Ground release",
            assertion_type_notes: "Observed condition upon release",
          },
        ],
      },
    ],
  },
];

// Helper to gather all seed assertion types
export const SEED_ASSERTION_TYPES: SeedAssertionType[] = [
  ...GENERAL_SEED_ASSERTION_TYPES,
  ...SEED_PROTOCOLS.flatMap((p) =>
    p.activity_templates.flatMap((a) => a.assertion_types),
  ),
];

export async function seedProtocolsAndAssertions(app: INestApplicationContext): Promise<void> {
  const logger = new Logger('ProtocolAssertionSeed');
  const ormService = app.get(OrmService);
  const dataService = app.get(DataService);

  // 1. Ensure foreign key columns exist in SQLite if table was already created
  try {
    const [atCols]: any = await ormService.sequelize.query('PRAGMA table_info(AssertionType)');
    const atColNames = Array.isArray(atCols) ? atCols.map((c: any) => c.name) : [];
    if (!atColNames.includes('activity_template_id')) {
      await ormService.sequelize.query('ALTER TABLE AssertionType ADD COLUMN activity_template_id VARCHAR(255)');
    }
    if (!atColNames.includes('ActivityTemplateId')) {
      await ormService.sequelize.query('ALTER TABLE AssertionType ADD COLUMN ActivityTemplateId VARCHAR(255)');
    }
  } catch (err: any) {
    logger.warn(`Could not verify AssertionType columns: ${err.message}`);
  }

  try {
    const [actCols]: any = await ormService.sequelize.query('PRAGMA table_info(ActivityTemplate)');
    const actColNames = Array.isArray(actCols) ? actCols.map((c: any) => c.name) : [];
    if (!actColNames.includes('protocol_id')) {
      await ormService.sequelize.query('ALTER TABLE ActivityTemplate ADD COLUMN protocol_id VARCHAR(255)');
    }
    if (!actColNames.includes('ProtocolId')) {
      await ormService.sequelize.query('ALTER TABLE ActivityTemplate ADD COLUMN ProtocolId VARCHAR(255)');
    }
  } catch (err: any) {
    logger.warn(`Could not verify ActivityTemplate columns: ${err.message}`);
  }

  const protocolModel = ormService.sequelize.model('Protocol');
  const activityTemplateModel = ormService.sequelize.model('ActivityTemplate');
  const assertionTypeModel = ormService.sequelize.model('AssertionType');

  // 2. Seed Protocols, ActivityTemplates, and their AssertionTypes
  for (const protoDef of SEED_PROTOCOLS) {
    let protocolRecord: any = await protocolModel.findOne({
      where: { protocol_name: protoDef.protocol_name },
    });

    if (!protocolRecord) {
      const saveRes = await dataService.save('Protocol', {
        protocol_name: protoDef.protocol_name,
      } as any);
      protocolRecord = saveRes.entity;
      logger.log(`Created Protocol: ${protoDef.protocol_name}`);
    } else {
      protocolRecord = protocolRecord.get ? protocolRecord.get({ plain: true }) : protocolRecord;
    }

    for (const actDef of protoDef.activity_templates) {
      let actRecord: any = await activityTemplateModel.findOne({
        where: {
          activity_template_name: actDef.activity_template_name,
          protocol_id: protocolRecord.id,
        },
      });

      if (!actRecord) {
        actRecord = await activityTemplateModel.findOne({
          where: { activity_template_name: actDef.activity_template_name },
        });
      }

      if (!actRecord) {
        const saveRes = await dataService.save('ActivityTemplate', {
          activity_template_name: actDef.activity_template_name,
          protocol_id: protocolRecord.id,
          ProtocolId: protocolRecord.id,
        } as any);
        actRecord = saveRes.entity;
        logger.log(`Created ActivityTemplate: ${actDef.activity_template_name} in Protocol: ${protoDef.protocol_name}`);
      } else {
        const act = actRecord.get ? actRecord.get({ plain: true }) : actRecord;
        await activityTemplateModel.update(
          {
            protocol_id: protocolRecord.id,
            ProtocolId: protocolRecord.id,
          },
          { where: { id: act.id } },
        );
        actRecord = act;
      }

      for (const atDef of actDef.assertion_types) {
        const existingAtRecord: any = await assertionTypeModel.findOne({
          where: { assertion_type_name: atDef.assertion_type_name },
        });

        const atPayload: any = {
          assertion_type_name: atDef.assertion_type_name,
          activity_template_id: actRecord.id,
          ActivityTemplateId: actRecord.id,
          assertion_unit: atDef.assertion_unit ?? '',
          assertion_value_class: atDef.assertion_value_class,
          assertion_value_enum_options: atDef.assertion_value_enum_options ?? null,
          assertion_value_number_min: atDef.assertion_value_number_min ?? null,
          assertion_value_number_max: atDef.assertion_value_number_max ?? null,
          assertion_value_decimal_places: atDef.assertion_value_decimal_places ?? null,
          assertion_method: atDef.assertion_method ?? null,
          assertion_type_notes: atDef.assertion_type_notes ?? null,
        };

        if (!existingAtRecord) {
          await dataService.save('AssertionType', atPayload);
          logger.log(`Created AssertionType: ${atDef.assertion_type_name} for ${actDef.activity_template_name}`);
        } else {
          const at = existingAtRecord.get ? existingAtRecord.get({ plain: true }) : existingAtRecord;
          await assertionTypeModel.update(atPayload, { where: { id: at.id } });
          logger.log(`Updated AssertionType: ${atDef.assertion_type_name} for ${actDef.activity_template_name}`);
        }
      }
    }
  }

  // 3. Seed General AssertionTypes (Darwin Core facts) not tied to a specific activity template
  for (const genDef of GENERAL_SEED_ASSERTION_TYPES) {
    const existingAtRecord: any = await assertionTypeModel.findOne({
      where: { assertion_type_name: genDef.assertion_type_name },
    });

    const atPayload: any = {
      assertion_type_name: genDef.assertion_type_name,
      assertion_unit: genDef.assertion_unit ?? '',
      assertion_value_class: genDef.assertion_value_class,
      assertion_value_enum_options: genDef.assertion_value_enum_options ?? null,
      assertion_value_number_min: genDef.assertion_value_number_min ?? null,
      assertion_value_number_max: genDef.assertion_value_number_max ?? null,
      assertion_value_decimal_places: genDef.assertion_value_decimal_places ?? null,
      assertion_method: genDef.assertion_method ?? null,
      assertion_type_notes: genDef.assertion_type_notes ?? null,
    };

    if (!existingAtRecord) {
      await dataService.save('AssertionType', atPayload);
      logger.log(`Created General AssertionType: ${genDef.assertion_type_name}`);
    } else {
      const at = existingAtRecord.get ? existingAtRecord.get({ plain: true }) : existingAtRecord;
      await assertionTypeModel.update(atPayload, { where: { id: at.id } });
      logger.log(`Updated General AssertionType: ${genDef.assertion_type_name}`);
    }
  }

  logger.log('Protocols, ActivityTemplates, and AssertionTypes seeded successfully.');
}
