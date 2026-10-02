import { INestApplicationContext, Logger } from '@nestjs/common';
import * as fs from "fs";
import * as path from "path";
import { v4 as uuid } from "uuid";

import { DataService, MapService, OrmService } from '@perfect-stack/nestjs-server';

export interface TaxonNode {
  scientific_name: string;
  common_name?: string;
  rank: string;
  parent?: string; // parent scientific_name
}

export const TAXON_NODES: TaxonNode[] = [
  // Kingdom (Root)
  { scientific_name: 'Animalia', common_name: 'Animals', rank: 'Kingdom' },

  // Phylum
  { scientific_name: 'Chordata', common_name: 'Chordates', rank: 'Phylum', parent: 'Animalia' },

  // Classes
  { scientific_name: 'Mammalia', common_name: 'Mammals', rank: 'Class', parent: 'Chordata' },
  { scientific_name: 'Aves', common_name: 'Birds', rank: 'Class', parent: 'Chordata' },
  { scientific_name: 'Actinopterygii', common_name: 'Ray-finned Fishes', rank: 'Class', parent: 'Chordata' },

  // Mammals -> Carnivora
  { scientific_name: 'Carnivora', common_name: 'Carnivorans', rank: 'Order', parent: 'Mammalia' },
  { scientific_name: 'Canidae', common_name: 'Canines', rank: 'Family', parent: 'Carnivora' },
  { scientific_name: 'Canis', common_name: 'Dogs', rank: 'Genus', parent: 'Canidae' },
  { scientific_name: 'Canis familiaris', common_name: 'Domestic Dog', rank: 'Species', parent: 'Canis' },

  { scientific_name: 'Felidae', common_name: 'Cats', rank: 'Family', parent: 'Carnivora' },
  { scientific_name: 'Felis', common_name: 'Small Cats', rank: 'Genus', parent: 'Felidae' },
  { scientific_name: 'Felis catus', common_name: 'Domestic Cat', rank: 'Species', parent: 'Felis' },

  // Birds:
  // 1. Psittaciformes (Parrots)
  { scientific_name: 'Psittaciformes', common_name: 'Parrots', rank: 'Order', parent: 'Aves' },
  { scientific_name: 'Psittaculidae', common_name: 'Old World Parrots', rank: 'Family', parent: 'Psittaciformes' },
  { scientific_name: 'Melopsittacus', rank: 'Genus', parent: 'Psittaculidae' },
  { scientific_name: 'Melopsittacus undulatus', common_name: 'Budgerigar', rank: 'Species', parent: 'Melopsittacus' },

  { scientific_name: 'Cacatuidae', common_name: 'Cockatoos', rank: 'Family', parent: 'Psittaciformes' },
  { scientific_name: 'Nymphicus', rank: 'Genus', parent: 'Cacatuidae' },
  { scientific_name: 'Nymphicus hollandicus', common_name: 'Cockatiel', rank: 'Species', parent: 'Nymphicus' },

  // Kakapo (Strigops habroptilus)
  { scientific_name: 'Strigopidae', common_name: 'New Zealand Parrots', rank: 'Family', parent: 'Psittaciformes' },
  { scientific_name: 'Strigops', common_name: 'Kākāpō Genus', rank: 'Genus', parent: 'Strigopidae' },
  { scientific_name: 'Strigops habroptilus', common_name: 'Kakapo', rank: 'Species', parent: 'Strigops' },

  // 2. Apterygiformes (Kiwis)
  { scientific_name: 'Apterygiformes', common_name: 'Kiwis', rank: 'Order', parent: 'Aves' },
  { scientific_name: 'Apterygidae', common_name: 'Kiwi Family', rank: 'Family', parent: 'Apterygiformes' },
  { scientific_name: 'Apteryx', common_name: 'Kiwis', rank: 'Genus', parent: 'Apterygidae' },
  { scientific_name: 'Apteryx mantelli', common_name: 'Kiwi', rank: 'Species', parent: 'Apteryx' },

  // 3. Sphenisciformes (Penguins)
  { scientific_name: 'Sphenisciformes', common_name: 'Penguins', rank: 'Order', parent: 'Aves' },
  { scientific_name: 'Spheniscidae', common_name: 'Penguins', rank: 'Family', parent: 'Sphenisciformes' },
  { scientific_name: 'Aptenodytes', common_name: 'Great Penguins', rank: 'Genus', parent: 'Spheniscidae' },
  { scientific_name: 'Aptenodytes forsteri', common_name: 'Penguin', rank: 'Species', parent: 'Aptenodytes' },

  // 4. Passeriformes (Perching Birds)
  { scientific_name: 'Passeriformes', common_name: 'Perching Birds', rank: 'Order', parent: 'Aves' },
  { scientific_name: 'Fringillidae', common_name: 'Finches', rank: 'Family', parent: 'Passeriformes' },
  { scientific_name: 'Serinus', common_name: 'Canaries', rank: 'Genus', parent: 'Fringillidae' },
  { scientific_name: 'Serinus canaria', common_name: 'Atlantic Canary', rank: 'Species', parent: 'Serinus' },

  // Fish:
  // 1. Goldfish (Carassius auratus) - Cypriniformes -> Cyprinidae -> Carassius
  { scientific_name: 'Cypriniformes', common_name: 'Carps and Minnows', rank: 'Order', parent: 'Actinopterygii' },
  { scientific_name: 'Cyprinidae', common_name: 'Carp Family', rank: 'Family', parent: 'Cypriniformes' },
  { scientific_name: 'Carassius', rank: 'Genus', parent: 'Cyprinidae' },
  { scientific_name: 'Carassius auratus', common_name: 'Goldfish', rank: 'Species', parent: 'Carassius' },

  // 2. Siamese Fighting Fish (Betta splendens) - Anabantiformes -> Osphronemidae -> Betta
  { scientific_name: 'Anabantiformes', common_name: 'Labyrinth Fishes', rank: 'Order', parent: 'Actinopterygii' },
  { scientific_name: 'Osphronemidae', common_name: 'Gouramis', rank: 'Family', parent: 'Anabantiformes' },
  { scientific_name: 'Betta', rank: 'Genus', parent: 'Osphronemidae' },
  { scientific_name: 'Betta splendens', common_name: 'Siamese Fighting Fish', rank: 'Species', parent: 'Betta' },

  // 3. Guppy (Poecilia reticulata) - Cyprinodontiformes -> Poeciliidae -> Poecilia
  { scientific_name: 'Cyprinodontiformes', common_name: 'Toothcarps', rank: 'Order', parent: 'Actinopterygii' },
  { scientific_name: 'Poeciliidae', common_name: 'Livebearers', rank: 'Family', parent: 'Cyprinodontiformes' },
  { scientific_name: 'Poecilia', rank: 'Genus', parent: 'Poeciliidae' },
  { scientific_name: 'Poecilia reticulata', common_name: 'Guppy', rank: 'Species', parent: 'Poecilia' },
];

export const SEED_OWNER = {
  given_name: 'Richard',
  family_name: 'Perfect',
  email_address: 'rperfect@gmail.com',
  phone_number: '021400222',
};

export const SEED_PETS = [
  {
    name: 'Jack',
    speciesScientificName: 'Felis catus',
    breed: 'cat',
    microchip_number: 'CHIP-CAT-001',
    birth_date: '2020-03-15',
  },
  {
    name: 'Molly',
    speciesScientificName: 'Felis catus',
    breed: 'cat',
    microchip_number: 'CHIP-CAT-002',
    birth_date: '2021-06-20',
  },
  {
    name: 'Thorin',
    speciesScientificName: 'Felis catus',
    breed: 'cat',
    microchip_number: 'CHIP-CAT-003',
    birth_date: '2019-11-08',
  },
  {
    name: 'Kevin',
    speciesScientificName: 'Strigops habroptilus',
    breed: 'Kakapo',
    microchip_number: 'CHIP-BIRD-001',
    birth_date: '2022-01-10',
  },
  {
    name: 'Kelly',
    speciesScientificName: 'Apteryx mantelli',
    breed: 'Kiwi',
    microchip_number: 'CHIP-BIRD-002',
    birth_date: '2022-04-18',
  },
  {
    name: 'Peter',
    speciesScientificName: 'Aptenodytes forsteri',
    breed: 'Penguin',
    microchip_number: 'CHIP-BIRD-003',
    birth_date: '2021-09-05',
  },
];

export const ADDRESS_COORDINATES: Record<string, { lat: number; lng: number }> = {
  '53 Rutherford St, Lower Hutt': { lat: -41.20690, lng: 174.90594 },
  '47 Collingwoord St, Lower Hutt': { lat: -41.21487, lng: 174.92150 },
  '47 Collingwood St, Lower Hutt': { lat: -41.21487, lng: 174.92150 },
  '109 Oxford Terrace, Lower Hutt': { lat: -41.20728, lng: 174.92962 },
  '376 Jackson St, Petone': { lat: -41.22670, lng: 174.88580 },
};

export interface ClinicCoordinates {
  easting: number | null;
  northing: number | null;
  geometry: { type: string; coordinates: [number, number] } | null;
}

export function calculateCoordinatesFromAddress(
  address: string,
  mapService: MapService = new MapService(),
): ClinicCoordinates {
  if (!address) {
    return { easting: null, northing: null, geometry: null };
  }

  const coords = ADDRESS_COORDINATES[address.trim()];
  if (!coords) {
    return { easting: null, northing: null, geometry: null };
  }

  const nztm = mapService.toNZTM({ lat: coords.lat, lng: coords.lng });
  return {
    easting: Math.round(nztm.easting),
    northing: Math.round(nztm.northing),
    geometry: {
      type: 'Point',
      coordinates: [coords.lng, coords.lat],
    },
  };
}

export const RAW_SEED_CLINICS = [
  {
    name: 'PETVET Lower Hutt',
    address: '53 Rutherford St, Lower Hutt',
    phone: '04 569 8830',
    is_24_hour: true,
  },
  {
    name: 'Central Hutt Vets',
    address: '47 Collingwoord St, Lower Hutt',
    phone: '04 569 3939',
    is_24_hour: false,
  },
  {
    name: 'Animal Health Centre',
    address: '109 Oxford Terrace, Lower Hutt',
    phone: '04 577 3717',
    is_24_hour: false,
  },
  {
    name: 'Animates Vetcare Clinic',
    address: '376 Jackson St, Petone',
    phone: '04 380 9827',
    is_24_hour: false,
  },
];

const defaultMapService = new MapService();

export const SEED_CLINICS = RAW_SEED_CLINICS.map((clinic) => {
  const coords = calculateCoordinatesFromAddress(clinic.address, defaultMapService);
  return {
    ...clinic,
    easting: coords.easting,
    northing: coords.northing,
    geometry: coords.geometry,
  };
});

export const SEED_PET_MEDIA: Record<string, string[]> = {
  Jack: [
    "20211125_185945.jpg",
    "20211125_190034.jpg",
    "20220613_182750.jpg",
    "20220905_183756.jpg",
    "20221123_213030.jpg",
    "20230425_153333.jpg",
    "20231112_210538.jpg",
    "20241001_150951.jpg",
    "20260306_185155.jpg",
    "20261001_145142.jpg",
    "20261001_145142_1.jpg",
    "20261001_145142_2.jpg",
    "20261001_145142_3.jpg",
    "20261001_145142_4.jpg",
    "20261001_145142_5.jpg",
    "20261001_145142_6.jpg",
    "20261001_145142_7.jpg",
  ],
  Molly: [
    "20180209_173401.jpg",
    "20230326_191419.jpg",
  ],
};

export async function seedDatabase(app: INestApplicationContext): Promise<void> {
  const logger = new Logger('VetClinicSeed');
  const ormService = app.get(OrmService);
  const dataService = app.get(DataService);

  const speciesModel = ormService.sequelize.model('Species');
  const ownerModel = ormService.sequelize.model('Owner');
  const petModel = ormService.sequelize.model('Pet');

  logger.log('Checking and applying initial seed data for Vet Clinic...');

  // 1. Seed Species
  const speciesByName: Record<string, any> = {};
  const existingSpecies = await speciesModel.findAll();
  for (const s of existingSpecies) {
    const raw = (s as any).get ? (s as any).get({ plain: true }) : (s as any);
    speciesByName[raw.scientific_name] = raw;
  }

  for (const node of TAXON_NODES) {
    let existing = speciesByName[node.scientific_name];
    let parentId: string | null = null;
    if (node.parent) {
      const parent = speciesByName[node.parent];
      if (parent) {
        parentId = parent.id;
      }
    }

    if (!existing) {
      const saveRes = await dataService.save('Species', {
        scientific_name: node.scientific_name,
        common_name: node.common_name,
        rank: node.rank,
        parent_id: parentId,
      } as any);
      existing = saveRes.entity;
      speciesByName[node.scientific_name] = existing;
      logger.log(`Created Species taxon: ${node.scientific_name} (${node.common_name || node.rank})`);
    } else {
      let needsUpdate = false;
      const updates: any = {};
      if (existing.parent_id !== parentId) {
        updates.parent_id = parentId;
        needsUpdate = true;
      }
      if (node.common_name && existing.common_name !== node.common_name) {
        updates.common_name = node.common_name;
        needsUpdate = true;
      }
      if (existing.rank !== node.rank) {
        updates.rank = node.rank;
        needsUpdate = true;
      }
      if (needsUpdate) {
        await speciesModel.update(updates, { where: { id: existing.id } });
        const updated = await speciesModel.findByPk(existing.id);
        speciesByName[node.scientific_name] = (updated as any)?.get ? (updated as any).get({ plain: true }) : updated;
      }
    }
  }

  // 2. Seed Owner (Richard Perfect)
  let ownerRecord: any = await ownerModel.findOne({ where: { email_address: SEED_OWNER.email_address } });
  let owner: any;
  if (!ownerRecord) {
    const saveOwnerRes = await dataService.save('Owner', {
      given_name: SEED_OWNER.given_name,
      family_name: SEED_OWNER.family_name,
      email_address: SEED_OWNER.email_address,
      phone_number: SEED_OWNER.phone_number,
    } as any);
    owner = saveOwnerRes.entity;
    logger.log(`Created Owner: ${SEED_OWNER.given_name} ${SEED_OWNER.family_name}`);
  } else {
    owner = ownerRecord.get ? ownerRecord.get({ plain: true }) : ownerRecord;
    await ownerModel.update(
      {
        given_name: SEED_OWNER.given_name,
        family_name: SEED_OWNER.family_name,
        phone_number: SEED_OWNER.phone_number,
      },
      { where: { id: owner.id } },
    );
  }

  // 3. Seed Pets
  for (const petDef of SEED_PETS) {
    const species = speciesByName[petDef.speciesScientificName];
    if (!species) {
      logger.warn(`Species ${petDef.speciesScientificName} not found for pet ${petDef.name}`);
      continue;
    }

    const petRecord: any = await petModel.findOne({
      where: {
        name: petDef.name,
        owner_id: owner.id,
      },
    });

    if (!petRecord) {
      await dataService.save('Pet', {
        name: petDef.name,
        species_id: species.id,
        owner_id: owner.id,
        breed: petDef.breed,
        birth_date: petDef.birth_date,
        microchip_number: petDef.microchip_number,
      } as any);
      logger.log(`Created Pet: ${petDef.name} (${petDef.breed}) for owner ${owner.given_name || owner.first_name} ${owner.family_name || owner.last_name}`);
    } else {
      const pet = petRecord.get ? petRecord.get({ plain: true }) : petRecord;
      await petModel.update(
        {
          species_id: species.id,
          owner_id: owner.id,
          breed: petDef.breed,
          birth_date: petDef.birth_date,
          microchip_number: petDef.microchip_number,
        },
        { where: { id: pet.id } },
      );
    }
  }

  // 4. Seed Pet Media Files
  const sourceDir = path.resolve(__dirname, "../../etc/test-data/cat-photos");
  const targetMediaDir = path.resolve(__dirname, "../media/Image");
  fs.mkdirSync(targetMediaDir, { recursive: true });

  for (const [petName, imageFilenames] of Object.entries(SEED_PET_MEDIA)) {
    const petRecord: any = await petModel.findOne({
      where: {
        name: petName,
        owner_id: owner.id,
      },
    });

    if (!petRecord) {
      logger.warn(`Cannot seed media for pet ${petName} - pet record not found.`);
      continue;
    }

    const pet = petRecord.get ? petRecord.get({ plain: true }) : petRecord;
    const validPaths = imageFilenames.map((f) => `Image/${f}`);

    // Clean up any obsolete/orphaned media records for this pet that are not in the seed list
    await ormService.sequelize.query(
      `DELETE FROM PetMediaFile WHERE pet_id = :petId AND path NOT IN (:validPaths)`,
      {
        replacements: { petId: pet.id, validPaths },
      },
    );

    for (const filename of imageFilenames) {
      const destRelativePath = `Image/${filename}`;

      // Copy file to target media directory
      if (fs.existsSync(sourceDir)) {
        const srcFullPath = path.resolve(sourceDir, filename);
        if (fs.existsSync(srcFullPath)) {
          const destFullPath = path.resolve(targetMediaDir, filename);
          if (!fs.existsSync(destFullPath)) {
            fs.copyFileSync(srcFullPath, destFullPath);
            logger.log(`Copied ${filename} to ${destFullPath}`);
          }
        } else {
          logger.warn(`Source cat photo not found: ${srcFullPath}`);
        }
      }

      // Check if PetMediaFile row exists
      const [existingRows]: any = await ormService.sequelize.query(
        `SELECT id FROM PetMediaFile WHERE pet_id = :petId AND path = :path LIMIT 1`,
        {
          replacements: { petId: pet.id, path: destRelativePath },
        },
      );

      const now = new Date().toISOString();
      if (!existingRows || existingRows.length === 0) {
        await ormService.sequelize.query(
          `INSERT INTO PetMediaFile (id, path, mime_type, comments, created_at, updated_at, pet_id) VALUES (:id, :path, :mimeType, :comments, :now, :now, :petId)`,
          {
            replacements: {
              id: uuid(),
              path: destRelativePath,
              mimeType: "image/jpeg",
              comments: filename,
              now,
              petId: pet.id,
            },
          },
        );
        logger.log(`Created PetMediaFile record for ${petName}: ${filename}`);
      } else {
        await ormService.sequelize.query(
          `UPDATE PetMediaFile SET comments = :comments, mime_type = :mimeType, updated_at = :now WHERE id = :id`,
          {
            replacements: {
              comments: filename,
              mimeType: "image/jpeg",
              now,
              id: existingRows[0].id,
            },
          },
        );
      }
    }
  }

  // 5. Seed Clinics
  const clinicModel = ormService.sequelize.model('Clinic');

  try {
    const [cols]: any = await ormService.sequelize.query('PRAGMA table_info(Clinic)');
    const colNames = Array.isArray(cols) ? cols.map((c: any) => c.name) : [];
    if (!colNames.includes('easting')) {
      await ormService.sequelize.query('ALTER TABLE Clinic ADD COLUMN easting DOUBLE');
    }
    if (!colNames.includes('northing')) {
      await ormService.sequelize.query('ALTER TABLE Clinic ADD COLUMN northing DOUBLE');
    }
    if (!colNames.includes('geometry')) {
      await ormService.sequelize.query('ALTER TABLE Clinic ADD COLUMN geometry JSON');
    }
  } catch (colErr: any) {
    logger.warn(`Could not verify/add Clinic columns: ${colErr.message}`);
  }

  for (const clinicDef of SEED_CLINICS) {
    const clinicRecord: any = await clinicModel.findOne({
      where: {
        name: clinicDef.name,
      },
    });

    if (!clinicRecord) {
      await dataService.save('Clinic', {
        name: clinicDef.name,
        address: clinicDef.address,
        phone: clinicDef.phone,
        is_24_hour: clinicDef.is_24_hour,
        easting: clinicDef.easting,
        northing: clinicDef.northing,
        geometry: clinicDef.geometry,
      } as any);
      logger.log(`Created Clinic: ${clinicDef.name}`);
    } else {
      const clinic = clinicRecord.get ? clinicRecord.get({ plain: true }) : clinicRecord;
      await clinicModel.update(
        {
          address: clinicDef.address,
          phone: clinicDef.phone,
          is_24_hour: clinicDef.is_24_hour,
          easting: clinicDef.easting,
          northing: clinicDef.northing,
          geometry: clinicDef.geometry,
        },
        { where: { id: clinic.id } },
      );
      logger.log(`Updated Clinic: ${clinicDef.name}`);
    }
  }

  logger.log('Initial seed data verified successfully.');
}

if (require.main === module) {
  (async () => {
    const { NestFactory } = await import('@nestjs/core');
    const { VetClinicServerModule } = await import('./vet-clinic-server.module');
    const { MetaEntityService, OrmService } = await import('@perfect-stack/nestjs-server');

    const app = await NestFactory.createApplicationContext(VetClinicServerModule, {
      logger: ['log', 'error', 'warn'],
    });

    const metaEntityService = app.get(MetaEntityService);
    const ormService = app.get(OrmService);
    await metaEntityService.syncMetaModelWithDatabase(false);
    await ormService.sequelize.sync();

    await seedDatabase(app);
    await app.close();
    process.exit(0);
  })().catch((err) => {
    console.error('Failed to seed database:', err);
    process.exit(1);
  });
}
