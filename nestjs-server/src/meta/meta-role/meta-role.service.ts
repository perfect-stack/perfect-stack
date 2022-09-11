import { Injectable } from '@nestjs/common';
import { FileRepositoryService } from '../../file/file-repository.service';
import { EntityResponse } from '../../domain/response/entity.response';
import { MetaRole } from '../../domain/meta.role';

@Injectable()
export class MetaRoleService {
  static readonly META_ROLE_DIR = 'meta/role';

  constructor(
    protected readonly fileRepositoryService: FileRepositoryService,
  ) {}

  async findAll(): Promise<MetaRole[]> {
    const resultList: MetaRole[] = [];
    const fileNames = await this.fileRepositoryService.listFiles(
      MetaRoleService.META_ROLE_DIR,
    );

    if (fileNames && fileNames.length > 0) {
      for (const nextName of fileNames) {
        const metaRole = await this.findOne(this.toMetaName(nextName));
        resultList.push(metaRole);
      }
    }
    return resultList;
  }

  async findOne(metaRoleName: string): Promise<MetaRole> {
    const metaRoleFromFile = JSON.parse(
      await this.fileRepositoryService.readFile(
        this.toMetaFileName(metaRoleName),
      ),
    );

    return Object.assign(new MetaRole(), metaRoleFromFile);
  }

  async create(metaRole: MetaRole): Promise<void> {
    await this.fileRepositoryService.writeFile(
      this.toMetaFileName(metaRole.name),
      JSON.stringify(metaRole, null, 2),
    );
    return;
  }

  async update(metaRole: MetaRole): Promise<EntityResponse> {
    await this.fileRepositoryService.writeFile(
      this.toMetaFileName(metaRole.name),
      JSON.stringify(metaRole, null, 2),
    );
    return;
  }

  async delete(metaRoleName: string): Promise<void> {
    return this.fileRepositoryService.deleteFile(
      this.toMetaFileName(metaRoleName),
    );
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
