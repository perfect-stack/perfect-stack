import {BatchJob} from "@app/batch/batch-job";
import {SettingsService} from "@app/settings/settings.service";
import {DataService} from "@app/data/data.service"
import {QueryService} from "@app/data/query.service";
import {Injectable} from "@nestjs/common";


@Injectable()
export class AgeClassBatchJob implements BatchJob {

    constructor(
        protected readonly settingsService: SettingsService,
        protected readonly dataService: DataService,
        protected readonly queryService: QueryService,
    ) {}

    async execute(): Promise<any> {
        console.log('AgeClassBatchJob.execute()');
        const rows = await this.selectBirds();
        await this.processRows(rows);
        return;
    }

    async selectBirds(): Promise<any[]> {
        const pool = await this.settingsService.getDatabasePool();
        const sql = 'Select id, "Bird".species_id, hatch_date, age_class from "Bird" where hatch_date is not null and age_class != \'Adult\' and status = \'Alive\'';
        const response = await pool.query(sql);
        const rows = response.rows;
        await pool.end();
        return rows;
    }

    async processRows(rows: any[]) {
        for(const row of rows) {
            const id = row.id;
            const speciesId = row.species_id;
            const hatchDate = row.hatch_date;
            const ageClass = row.age_class;
            const status = row.status;

            const newAgeClass = this.calculateNewAgeClass(speciesId, hatchDate);

            console.log('Row: ', JSON.stringify(row));
        }
        return;
    }

    calculateNewAgeClass(speciesId, hatchDate): string {
        return null;
    }

    async updateAgeClass(birdId: string, newAgeClass: string): Promise<any> {
        const birdEntity = await this.queryService.findOne('Bird', birdId);
        birdEntity['age_class'] = newAgeClass;
        //const response = await this.dataService.save('Bird', birdEntity);
    }
}