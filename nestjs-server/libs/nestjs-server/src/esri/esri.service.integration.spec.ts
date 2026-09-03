import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { ESRIService } from './esri.service';
import { EsriModule } from './esri.module';

describe('ESRIService (Integration)', () => {
  let service: ESRIService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: [
            process.env.NESTJS_ENV || './env/local-capture.env',
            './env/local.env',
          ],
        }),
        EsriModule,
      ],
    }).compile();

    service = module.get<ESRIService>(ESRIService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Reference Points & Field Capture Locations Altitude Lookups (NZTM2000)', () => {
    const testLocations = [
      {
        name: 'Petone Beach',
        easting: 1756902,
        northing: 5434431,
        expectedAltitude: 2.47,
        maxExpected: 15,
        minExpected: 0,
      },
      {
        name: 'Mt Tongariro',
        easting: 1828442,
        northing: 5665471,
        expectedAltitude: 1858.82,
        minExpected: 1700,
        maxExpected: 2100,
      },
      {
        name: 'Desert Road Peak',
        easting: 1837966,
        northing: 5644656,
        expectedAltitude: 1302.96,
        minExpected: 900,
        maxExpected: 1400,
      },
      {
        name: 'EglintonEastBranch_1230_CAR',
        easting: 1208615,
        northing: 4997480,
        expectedAltitude: 1120.88,
        minExpected: 1000,
        maxExpected: 1400,
      },
      {
        name: 'Dunton_1300_CAR',
        easting: 1207924,
        northing: 4977916,
        expectedAltitude: 1292.91,
        minExpected: 1150,
        maxExpected: 1450,
      },
      {
        name: 'Dunton_1180_CAR',
        easting: 1208254,
        northing: 4977134,
        expectedAltitude: 1172.45,
        minExpected: 1000,
        maxExpected: 1300,
      },
      {
        name: 'Dunton_1040_CAR',
        easting: 1208131,
        northing: 4976862,
        expectedAltitude: 1045.59,
        minExpected: 900,
        maxExpected: 1200,
      },
      {
        name: 'Dunton_0640_CAR',
        easting: 1207692,
        northing: 4976038,
        expectedAltitude: 633.3,
        minExpected: 550,
        maxExpected: 750,
      },
      {
        name: 'Dunton_0460_CAR',
        easting: 1206540,
        northing: 4975238,
        expectedAltitude: 447.85,
        minExpected: 380,
        maxExpected: 580,
      },
      {
        name: 'Elizabeth_0150_CAR',
        easting: 1144091,
        northing: 4953273,
        expectedAltitude: 163.9,
        minExpected: 100,
        maxExpected: 300,
      },
      {
        name: 'Elizabeth_0300_CAR',
        easting: 1146888,
        northing: 4953045,
        expectedAltitude: 297.0,
        minExpected: 220,
        maxExpected: 420,
      },
      {
        name: 'Elizabeth_0600_CAR',
        easting: 1148195,
        northing: 4952992,
        expectedAltitude: 612.13,
        minExpected: 500,
        maxExpected: 750,
      },
      {
        name: 'HaurokoBurn_400_CAR',
        easting: 1144755,
        northing: 4917099,
        expectedAltitude: 412.88,
        minExpected: 350,
        maxExpected: 500,
      },
      {
        name: 'HaurokoBurn_460_CAR',
        easting: 1144559,
        northing: 4919563,
        expectedAltitude: 472.14,
        minExpected: 400,
        maxExpected: 580,
      },
      {
        name: 'HaurokoBurn_700_CAR',
        easting: 1143567,
        northing: 4920945,
        expectedAltitude: 707.13,
        minExpected: 600,
        maxExpected: 850,
      },
      {
        name: 'Oonah_0320_CAR',
        easting: 1152961,
        northing: 4949300,
        expectedAltitude: 313.81,
        minExpected: 250,
        maxExpected: 420,
      },
      {
        name: 'Oonah_0500_CAR',
        easting: 1150524,
        northing: 4950367,
        expectedAltitude: 516.13,
        minExpected: 420,
        maxExpected: 620,
      },
      {
        name: 'Oonah_0760_CAR',
        easting: 1150542,
        northing: 4952112,
        expectedAltitude: 753.13,
        minExpected: 650,
        maxExpected: 880,
      },
      {
        name: 'Oonah_Alps_0990_CAR',
        easting: 1150537,
        northing: 4953109,
        expectedAltitude: 971.13,
        minExpected: 850,
        maxExpected: 1100,
      },
      {
        name: 'Oonah_Alps_1140_CAR',
        easting: 1150634,
        northing: 4953493,
        expectedAltitude: 1127.13,
        minExpected: 980,
        maxExpected: 1300,
      },
    ];

    testLocations.forEach((location) => {
      it(
        `should find altitude for ${location.name} (${location.easting}, ${location.northing}) via live service`,
        async () => {
          const altitude = await service.getAltitude(
            location.easting,
            location.northing,
          );

          expect(altitude).not.toBeNull();
          expect(typeof altitude).toBe('number');
          expect(altitude!).toBeGreaterThanOrEqual(location.minExpected);
          expect(altitude!).toBeLessThanOrEqual(location.maxExpected);
        },
        30000,
      );
    });
  });
});
