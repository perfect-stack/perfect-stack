import { Injectable, Logger, Param } from '@nestjs/common';
import { OrmService } from '../orm/orm.service';
import { Audit, AuditAction } from '../domain/audit';
import { Request } from 'express';
import * as uuid from 'uuid';
import { ZonedDateTime, ZoneOffset } from '@js-joda/core';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(protected readonly ormService: OrmService) {}

  async audit(
    request: Request,
    entityName: string,
    entityId: string,
    action: AuditAction,
    duration: number,
  ) {
    let personName = 'Unknown';
    let personId = 'Unknown';

    if (request) {
      const user = request.user as any;
      if (user) {
        // TODO: Firebase
        if (user.name && user.user_id) {
          personName = user.name; // TODO: This is probably Authentication provider specific
          personId = user.user_id; // TODO: This is probably Authentication provider specific
        }

        // Cognito (AzureAD)
        if (user.given_name || user.family_name) {
          personName = `${user.given_name} ${user.family_name}`;
          if (user.name) {
            personId = user.name;
          } else if (user['cognito:username']) {
            personId = user['cognito:username'];
          }
        }

        // Cognito (Plain Cognito group)
        if (!personName && user.username) {
          personName = user.username;
          personId = user.username;
        }

        if (!personName) {
          throw new Error(`Unable to find user name in request`);
        }

        if (!personId) {
          throw new Error(`Unable to find user id in request`);
        }
      } else {
        throw new Error(`No user object supplied in the request object`);
      }
    } else {
      throw new Error(`No request object supplied to audit method`);
    }

    this.logger.log(
      `audit(): ${entityName}, ${entityId}, ${action}, ${personName}, ${personId}, ${duration}`,
    );

    const model = this.ormService.sequelize.model('Audit');
    if (model) {
      await model.create({
        id: uuid.v4(),
        date_time: ZonedDateTime.now(ZoneOffset.UTC).toString(),
        action: action,
        meta_entity: entityName,
        entity_id: entityId,
        person_name: personName,
        person_id: personId,
        duration: duration,
      } as any);

      return;
    } else {
      throw new Error(
        'Unable to find the Audit meta entity. Have you created it yet?',
      );
    }
  }

  async findAll(id: string) {
    const model = this.ormService.sequelize.model('Audit');
    if (model) {
      return await model.findAll({
        where: {
          entity_id: id,
        },
        order: ['date_time'],
      });
    } else {
      throw new Error(
        'Unable to find the Audit meta entity. Have you created it yet?',
      );
    }
  }
}
