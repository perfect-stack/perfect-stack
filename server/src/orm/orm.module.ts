import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Person } from '../domain/person';

@Module({
  imports: [
    MikroOrmModule.forRoot(),
    MikroOrmModule.forFeature({
      entities: [Person],
    }),
  ],
  exports: [MikroOrmModule],
})
export class OrmModule {}
