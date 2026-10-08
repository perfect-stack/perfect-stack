import { Injectable, Logger } from '@nestjs/common';
import {
  JobExecutionContext,
  OrmService,
  TaskJobHandler,
} from '@perfect-stack/nestjs-server';

@Injectable()
export class PetScanBatchJobService implements TaskJobHandler {
  public static readonly JOB_NAME = 'Pet Scan';

  private readonly logger = new Logger(PetScanBatchJobService.name);
  readonly type = 'task' as const;

  constructor(protected readonly ormService: OrmService) {}

  showInBatchUI(): boolean {
    return true;
  }

  async getSummary(): Promise<any> {
    try {
      const petModel = this.ormService.sequelize.isDefined('Pet')
        ? this.ormService.sequelize.model('Pet')
        : null;
      const count = petModel ? await petModel.count() : 0;
      return {
        rowCount: count,
        totalPets: count,
      };
    } catch (err: any) {
      this.logger.warn(`Failed to get Pet Scan summary: ${err?.message}`);
      return { rowCount: 0 };
    }
  }

  async execute(context?: JobExecutionContext): Promise<any> {
    this.logger.log('Executing Pet Scan batch job...');
    const petModel = this.ormService.sequelize.isDefined('Pet')
      ? this.ormService.sequelize.model('Pet')
      : null;

    const pets = petModel ? await petModel.findAll({ order: [['id', 'ASC']] }) : [];
    const totalSteps = Math.max(pets.length, 10);
    const stepDelayMs = parseInt(process.env.PET_SCAN_STEP_DELAY_MS || '600', 10);

    let scannedPets = 0;
    for (let i = 0; i < totalSteps; i++) {
      const pet = pets[i];
      const petName = pet ? ((pet as any).get ? (pet as any).get('name') : (pet as any).name) : null;
      const petBreed = pet ? ((pet as any).get ? (pet as any).get('breed') : (pet as any).breed) : null;

      const statusMsg = petName
        ? `Scanning pet ${i + 1} of ${totalSteps}: ${petName}${petBreed ? ` (${petBreed})` : ''}`
        : `Scanning pet partition ${i + 1} of ${totalSteps}`;

      // Simulate asynchronous scanning delay between items/partitions
      await this.sleep(stepDelayMs);

      if (context) {
        await context.updateProgress(i + 1, totalSteps, statusMsg);
      }

      if (pet) {
        scannedPets++;
      }
    }

    const result = {
      scannedPets: pets.length > 0 ? scannedPets : totalSteps,
      totalSteps,
      status: 'Healthy',
      completedAt: new Date().toISOString(),
    };

    if (context) {
      context.setSummary(result);
    }

    this.logger.log(`Pet Scan batch job finished successfully: ${JSON.stringify(result)}`);
    return result;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
