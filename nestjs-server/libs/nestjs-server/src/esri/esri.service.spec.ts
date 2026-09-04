import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ESRIService, EsriIdentifyResponse } from './esri.service';
import { EsriModule } from './esri.module';

describe('ESRIService (Unit)', () => {
  let service: ESRIService;
  let httpService: HttpService;
  let configService: ConfigService;

  const createAxiosResponse = (data: any): AxiosResponse<any> => ({
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as InternalAxiosRequestConfig,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [EsriModule],
    })
      .overrideProvider(HttpService)
      .useValue({
        get: jest.fn(),
      })
      .overrideProvider(ConfigService)
      .useValue({
        get: jest.fn((key: string) => {
          if (key === 'ESRI_API_KEY') return 'test-esri-api-key';
          return undefined;
        }),
      })
      .compile();

    service = module.get<ESRIService>(ESRIService);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('NZTM Coordinate Parsing & Request Handling', () => {
    it('should query ESRI WorldElevation Terrain with WGS84 coordinates and ESRI_API_KEY from ConfigService', async () => {
      const mockResponse: EsriIdentifyResponse = {
        objectId: 0,
        name: 'Pixel',
        value: '10.5',
      };

      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of(createAxiosResponse(mockResponse)));

      const altitude = await service.getAltitude(1756902, 5434431);
      expect(altitude).toBe(10.5);
      expect(httpService.get).toHaveBeenCalledWith(
        ESRIService.ESRI_TERRAIN_URL,
        expect.objectContaining({
          params: expect.objectContaining({
            geometryType: 'esriGeometryPoint',
            token: 'test-esri-api-key',
            f: 'json',
          }),
        }),
      );
    });

    it('should support object parameter containing easting and northing', async () => {
      const mockResponse: EsriIdentifyResponse = {
        value: '25.0',
      };

      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of(createAxiosResponse(mockResponse)));

      const altitude = await service.getAltitude({
        easting: 1756902,
        northing: 5434431,
      });
      expect(altitude).toBe(25.0);
    });

    it('should support object parameter containing x and y', async () => {
      const mockResponse: EsriIdentifyResponse = {
        value: '35.0',
      };

      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of(createAxiosResponse(mockResponse)));

      const altitude = await service.getAltitude({
        x: 1756902,
        y: 5434431,
      });
      expect(altitude).toBe(35.0);
    });
  });

  describe('Missing API Key Handling', () => {
    it('should throw an error when ESRI_API_KEY is not configured and ENV_NAME is not set', async () => {
      jest.spyOn(configService, 'get').mockReturnValue(undefined);

      await expect(service.getAltitude(1756902, 5434431)).rejects.toThrow(
        /No ESRI_API_KEY configured in ConfigService or AWS Secrets Manager/,
      );
    });
  });

  describe('Fallback and Error Handling', () => {
    it('should return altitude from properties.Values if value is missing', async () => {
      const mockResponse: EsriIdentifyResponse = {
        properties: {
          Values: ['45.8'],
        },
      };

      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of(createAxiosResponse(mockResponse)));

      const altitude = await service.getAltitude(1750000, 5430000);
      expect(altitude).toBe(45.8);
    });

    it('should fallback to NZ Elevation service and Terrain3D when Terrain service returns NoData', async () => {
      const terrainNoDataResponse: EsriIdentifyResponse = {
        value: 'NoData',
      };

      const nzNoDataResponse: EsriIdentifyResponse = {
        value: 'NoData',
      };

      const terrain3dResponse: EsriIdentifyResponse = {
        value: '1128',
      };

      jest
        .spyOn(httpService, 'get')
        .mockReturnValueOnce(of(createAxiosResponse(terrainNoDataResponse)))
        .mockReturnValueOnce(of(createAxiosResponse(nzNoDataResponse)))
        .mockReturnValueOnce(of(createAxiosResponse(terrain3dResponse)));

      const altitude = await service.getAltitude(1150634, 4953493);
      expect(altitude).toBe(1128);
      expect(httpService.get).toHaveBeenNthCalledWith(
        1,
        ESRIService.ESRI_TERRAIN_URL,
        expect.anything(),
      );
      expect(httpService.get).toHaveBeenNthCalledWith(
        2,
        ESRIService.NZ_ELEVATION_SERVICE_URL,
        expect.anything(),
      );
      expect(httpService.get).toHaveBeenNthCalledWith(
        3,
        ESRIService.ESRI_TERRAIN_3D_URL,
        expect.anything(),
      );
    });

    it('should return null for invalid coordinates', async () => {
      const altitude = await service.getAltitude(NaN, 5430000);
      expect(altitude).toBeNull();
      expect(httpService.get).not.toHaveBeenCalled();
    });

    it('should return null when all elevation lookups fail', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(throwError(() => new Error('Network error')));

      const altitude = await service.getAltitude(1750000, 5430000);
      expect(altitude).toBeNull();
    });
  });
});
