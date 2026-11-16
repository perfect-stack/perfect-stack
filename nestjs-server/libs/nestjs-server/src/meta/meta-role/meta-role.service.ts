import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileRepositoryService } from '../../file/file-repository.service';
import { EntityResponse } from '../../domain/response/entity.response';
import { MetaRole } from '../../domain/meta.role';
import { MetaEditControlValue } from '../meta-edit/meta-edit-control-value';
import { isMetaCacheEnabledFor } from '../meta-edit/meta-edit-utils';

@Injectable()
export class MetaRoleService {
  static readonly META_ROLE_DIR = 'role';

  private cacheMap: Map<string, MetaRole> | null = null;
  private cacheLoadPromise: Promise<Map<string, MetaRole>> | null = null;

  constructor(
    protected readonly fileRepositoryService: FileRepositoryService,
    protected readonly configService: ConfigService,
  ) {}

  cacheReset(): void {
    this.cacheMap = null;
    this.cacheLoadPromise = null;
  }

  private isCacheEnabled(): boolean {
    return isMetaCacheEnabledFor(this.configService, MetaEditControlValue.Role);
  }

  private async loadAllIntoMap(): Promise<Map<string, MetaRole>> {
    const resultMap = new Map<string, MetaRole>();
    const fileNames = await this.fileRepositoryService.listFiles(
      MetaRoleService.META_ROLE_DIR,
    );

    if (fileNames && fileNames.length > 0) {
      const metaRoles = await Promise.all(
        fileNames.map((nextName) =>
          this.readMetaRoleFromFile(this.toMetaName(nextName)),
        ),
      );
      for (const metaRole of metaRoles) {
        resultMap.set(metaRole.name, metaRole);
      }
    }
    return resultMap;
  }

  async findAllMap(): Promise<Map<string, MetaRole>> {
    if (!this.isCacheEnabled()) {
      return this.loadAllIntoMap();
    }

    if (this.cacheMap) {
      return this.cacheMap;
    }

    if (!this.cacheLoadPromise) {
      const loadPromise = this.loadAllIntoMap()
        .then((map) => {
          if (this.cacheLoadPromise === loadPromise) {
            this.cacheMap = map;
            this.cacheLoadPromise = null;
          }
          return map;
        })
        .catch((err) => {
          if (this.cacheLoadPromise === loadPromise) {
            this.cacheLoadPromise = null;
          }
          throw err;
        });
      this.cacheLoadPromise = loadPromise;
    }

    return this.cacheLoadPromise;
  }

  async findAll(): Promise<MetaRole[]> {
    const metaRoleMap = await this.findAllMap();
    return Array.from(metaRoleMap.values());
  }

  private async readMetaRoleFromFile(metaRoleName: string): Promise<MetaRole> {
    const metaRoleFromFile = JSON.parse(
      await this.fileRepositoryService.readFile(
        this.toMetaFileName(metaRoleName),
      ),
    );

    return Object.assign(new MetaRole(), metaRoleFromFile);
  }

  async findOne(metaRoleName: string): Promise<MetaRole> {
    if (this.isCacheEnabled()) {
      const metaRoleMap = await this.findAllMap();
      const metaRole = metaRoleMap.get(metaRoleName);
      if (!metaRole) {
        throw new Error(`Unable to find MetaRole ${metaRoleName}`);
      }
      return metaRole;
    }

    return this.readMetaRoleFromFile(metaRoleName);
  }

  async create(metaRole: MetaRole): Promise<void> {
    await this.fileRepositoryService.writeFile(
      this.toMetaFileName(metaRole.name),
      JSON.stringify(metaRole, null, 2),
    );
    this.cacheReset();
    return;
  }

  async update(metaRole: MetaRole): Promise<EntityResponse> {
    await this.fileRepositoryService.writeFile(
      this.toMetaFileName(metaRole.name),
      JSON.stringify(metaRole, null, 2),
    );
    this.cacheReset();
    return;
  }

  async delete(metaRoleName: string): Promise<void> {
    await this.fileRepositoryService.deleteFile(
      this.toMetaFileName(metaRoleName),
    );
    this.cacheReset();
  }

  toMetaName(filename: string) {
    if (filename.endsWith('.json')) {
      return filename.substring(0, filename.indexOf('.json'));
    } else {
      throw new Error(`File name of "${filename}" does not end with .json`);
    }
  }

  toMetaFileName(metaRoleName: string) {
    return MetaRoleService.META_ROLE_DIR + '/' + metaRoleName + '.json';
  }
}
