import {BatchJob} from "@app/batch/batch-job";
import {SettingsService} from "@app/settings/settings.service";
import {DataService} from "@app/data/data.service"
import {QueryService} from "@app/data/query.service";
import {Injectable} from "@nestjs/common";


enum AgingStrategy {
    CONTINUOUS, // Age is calculated continuously from hatch date
    ANNIVERSARY, // Age increments on a specific date each year
}

interface AgeClassDefinition {
    name: string;
    minMonths: number;
    maxMonths: number;
}

interface SpeciesAgingConfig {
    strategy: AgingStrategy;
    ageClasses: AgeClassDefinition[];
    anniversary?: { month: number; day: number }; // Used for ANNIVERSARY strategy. Month is 1-based.
}

@Injectable()
export class AgeClassBatchJob implements BatchJob {

    // This configuration can be externalized to a database table or a config file for better maintainability.
    private readonly speciesAgingConfig: Record<string, SpeciesAgingConfig> = {
        'Kea': {
            strategy: AgingStrategy.ANNIVERSARY,
            anniversary: { month: 1, day: 1 }, // January 1st
            ageClasses: [
                { name: 'Nestling', minMonths: 0, maxMonths: 3 },
                { name: 'Fledgling', minMonths: 3, maxMonths: 12 },
                { name: 'Juvenile', minMonths: 12, maxMonths: 24 },
                { name: 'Subadult', minMonths: 24, maxMonths: 36 },
                { name: 'Adult', minMonths: 36, maxMonths: Infinity },
            ]
        },
        'TODO-Kiwi': {
            strategy: AgingStrategy.CONTINUOUS,
            ageClasses: [
                { name: 'Chick', minMonths: 0, maxMonths: 2 },
                { name: 'Juvenile', minMonths: 2, maxMonths: 6 },
                { name: 'Subadult', minMonths: 6, maxMonths: 48 },
                { name: 'Adult', minMonths: 48, maxMonths: Infinity },
            ]
        },
        // A default for other species. You can add more species-specific configs here.
        'Default': {
            strategy: AgingStrategy.CONTINUOUS,
            ageClasses: [
                { name: 'Nestling', minMonths: 0, maxMonths: 3 },
                { name: 'Fledgling', minMonths: 3, maxMonths: 12 },
                { name: 'Juvenile', minMonths: 12, maxMonths: 24 },
                { name: 'Subadult', minMonths: 24, maxMonths: 36 },
                { name: 'Adult', minMonths: 36, maxMonths: Infinity },
            ]
        }
    };

    constructor(
        protected readonly settingsService: SettingsService,
        protected readonly dataService: DataService,
        protected readonly queryService: QueryService,
    ) {}

    async execute(): Promise<any> {
        console.log('AgeClassBatchJob.execute()');
        const rows = await this.selectBirds();
        const result = await this.processRows(rows);
        console.log('AgeClassBatchJob.execute() finished.');
        console.log('AgeClassBatchJob - Result: ', result);
        return;
    }

    async selectBirds(): Promise<any[]> {
        const pool = await this.settingsService.getDatabasePool();
        // Join with Species table to get the species name for our logic
        const sql = `
          SELECT 
            b.id, 
            b.hatch_date,
            b.demise_date,
            b.age_class,
            s.name as species_name
          FROM "Bird" b
          JOIN "Species" s ON b.species_id = s.id
          WHERE b.hatch_date IS NOT NULL 
            AND b.age_class is null OR b.age_class != 'Adult' 
            AND b.status = 'Alive'
            AND b.data_source != 'SKYRANGER'
        `;
        const response = await pool.query(sql);
        const rows = response.rows;
        await pool.end();
        return rows;
    }

    async processRows(rows: any[]) {
        const totalCount = rows.length;
        let updatedCount = 0;
        for(const row of rows) {
            const birdId = row.id;
            const speciesName = row.species_name;
            const hatchDate = row.hatch_date;
            const demiseDate = row.demise_date;
            const currentAgeClass = row.age_class;

            const newAgeClass = this.calculateNewAgeClass(speciesName, hatchDate, demiseDate);

            if (newAgeClass && newAgeClass !== currentAgeClass) {
                console.log(`Updating bird ${birdId} (${speciesName}) from ${currentAgeClass} to ${newAgeClass}`);
                updatedCount = updatedCount + 1;
                //await this.updateAgeClass(birdId, newAgeClass);
            }
        }

        return { updatedCount, totalCount }
    }

    /**
     * Calculates the new age class for a bird based on its species and hatch date.
     * @param speciesName The name of the species.
     * @param hatchDateStr The hatch date as a string.
     * @param demiseDateStr The demise date as a string.
     * @returns The calculated age class name, or null if no matching class is found.
     */
    calculateNewAgeClass(speciesName: string, hatchDateStr: string, demiseDateStr: string | null): string {
        const config = this.speciesAgingConfig[speciesName] || this.speciesAgingConfig['Default'];
        if (!hatchDateStr) {
            return null;
        }

        const hatchDate = new Date(hatchDateStr);

        // If there is a Demise Date then we use that to limit how old the Bird can be (it can't get any older if it's
        // dead already). Also, we do want the current date even if we might not have seen the bird in a number of
        // years, and we assume that the bird is still alive and probably made it to being an adult until proven
        // otherwise.
        const demiseOrCurrentDate = demiseDateStr ? new Date(demiseDateStr) : new Date();

        let ageInMonths: number;
        if (config.strategy === AgingStrategy.ANNIVERSARY) {
            const continuousAgeInMonths = this.getMonthsDifference(hatchDate, demiseOrCurrentDate);

            // For the first year, age calculation is continuous.
            if (continuousAgeInMonths < 12) {
                ageInMonths = continuousAgeInMonths;
            } else {
                // After 1 year, age is based on the number of calendar years passed (age increments on Jan 1st for Kea).
                const ageInYears = demiseOrCurrentDate.getFullYear() - hatchDate.getFullYear();
                ageInMonths = ageInYears * 12;
            }
        } else { // CONTINUOUS
            ageInMonths = this.getMonthsDifference(hatchDate, demiseOrCurrentDate);
        }

        for (const ageClass of config.ageClasses) {
            if (ageInMonths >= ageClass.minMonths && ageInMonths < ageClass.maxMonths) {
                return ageClass.name;
            }
        }

        return null;
    }

    /**
     * Calculates the number of full months between two dates.
     */
    private getMonthsDifference(d1: Date, d2: Date): number {
        let months;
        months = (d2.getFullYear() - d1.getFullYear()) * 12;
        months -= d1.getMonth();
        months += d2.getMonth();
        if (d2.getDate() < d1.getDate()) {
            months--;
        }
        return months <= 0 ? 0 : months;
    }

    async updateAgeClass(birdId: string, newAgeClass: string): Promise<any> {
        const birdEntity = await this.queryService.findOne('Bird', birdId);
        if (birdEntity) {
            birdEntity['age_class'] = newAgeClass;
            return await this.dataService.save('Bird', birdEntity);
        }
        else {
            console.error(`Could not find Bird with id ${birdId} to update age class.`);
        }
    }
}