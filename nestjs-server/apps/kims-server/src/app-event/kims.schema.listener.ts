import {SchemaListener} from "@perfect-stack/nestjs-server/event/event.service";
import {Injectable, Logger} from "@nestjs/common";
import {DataService, QueryService} from "@perfect-stack/nestjs-server";

const NEST_FAILURE_REASONS = [
    { uuid: 'bee46fce-bc29-46ae-835b-f89bf58920b7', name: 'Natural - lack of food, disease, infertility' },
    { uuid: '3d1ddc3d-7ad5-471a-9c4b-9ac6ad4a0ae2', name: 'Predation - feral cat' },
    { uuid: 'd5342793-7a7b-4985-96e6-d9a5013fbc6e', name: 'Predation - stoat' },
    { uuid: '7236e7cf-4a2d-4c06-8650-c0e4e6e5904f', name: 'Predation - possum' },
    { uuid: 'd64aba30-3635-4bd0-9835-fa8d62f410c0', name: 'Predation - unknown' },
    { uuid: '5a162b71-e672-47a0-8362-58611265174b', name: 'Predation - other' },
    { uuid: '131467e8-d6f6-4539-ad1a-15227f9e791f', name: 'Suspected interference - possum' },
    { uuid: '121d14eb-6122-49de-bc0d-3e841f616d1b', name: 'Weather - snow, flood etc' },
    { uuid: '0f14ef9d-9a02-4301-be3e-4c7e0a4c8ae3', name: 'Other - see comments' },
    { uuid: '1ba26994-d146-46f0-a9ed-3ecf4f5f8251', name: 'Unknown' },
];


@Injectable()
export class KimsSchemaListener implements SchemaListener {

    private readonly logger = new Logger(KimsSchemaListener.name);

    constructor(
        protected readonly queryService: QueryService,
        protected readonly dataService: DataService,
    ) {}


    async onSchemaUpdate(): Promise<void> {
        this.logger.warn('onSchemaUpdate()');
        await this.initNestFailureReasons();
    }

    private async initNestFailureReasons() {
        const queryResponse = await this.queryService.findAll('NestFailureReason');
        if (queryResponse.totalCount === 0) {
            this.logger.log('InitNestFailureReasons - STARTED');
            try {
                for (const nextReason of NEST_FAILURE_REASONS) {

                    const reasonEntity: any = {
                        id: nextReason.uuid,
                        name: nextReason.name,
                    };

                    await this.dataService.save('NestFailureReason', reasonEntity);
                }
                this.logger.log(`InitNestFailureReasons - COMPLETED: ${NEST_FAILURE_REASONS.length} reasons loaded.`);
            } catch (error) {
                this.logger.error('InitNestFailureReasons - FAILED', error.stack);
            }
        }
        else {
            const resultList: any[] = queryResponse.resultList as any[];
            const needsUpdate = resultList.filter(reason => reason.sort_index === null || reason.sort_index === undefined).length > 0;
            if(needsUpdate) {
                this.logger.log('InitNestFailureReasons - UPDATE REQUIRED');
                for(const nextReason of resultList) {
                    if(nextReason.sort_index === null || nextReason.sort_index === undefined) {
                        // find nextReason.id in NEST_FAILURE_REASONS and use the position index found to update the sort_index
                        const sortIndex = NEST_FAILURE_REASONS.findIndex(reason => reason.uuid === nextReason.id);
                        this.logger.log(`InitNestFailureReasons - update required for: ${nextReason.id} - ${nextReason.name} => ${sortIndex}`);
                        const reasonToUpdate = {
                            id: nextReason.id,
                            sort_index: sortIndex,
                        };
                        await this.dataService.save('NestFailureReason', reasonToUpdate);
                    }
                }
            }
            else {
                this.logger.log('InitNestFailureReasons - NOT REQUIRED');
            }
        }
    }
}