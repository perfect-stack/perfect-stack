import { Module } from '@nestjs/common';
import { MetaRoleController } from './meta-role.controller';
import { MetaRoleService } from './meta-role.service';
import { FileRepositoryModule } from '../../file/file-repository.module';

@Module({
  controllers: [MetaRoleController],
  providers: [MetaRoleService],
  imports: [FileRepositoryModule],
  exports: [MetaRoleService],
})
export class MetaRoleModule {}
