import { Module } from '@nestjs/common';
import { MetaController } from './meta.controller';
import { MetaService } from './meta.service';
import { OrmModule } from '../orm/orm.module';

@Module({
  controllers: [MetaController],
  imports: [OrmModule],
  providers: [MetaService],
  exports: [MetaService],
})
export class MetaModule {}
