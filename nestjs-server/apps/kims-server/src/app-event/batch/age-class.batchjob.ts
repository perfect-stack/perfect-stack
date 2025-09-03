import {Injectable} from "@nestjs/common";
import {Pool} from "pg";
import {BatchJob} from "@perfect-stack/nestjs-server/batch/batch-job";
import {SettingsService} from "@perfect-stack/nestjs-server/settings/settings.service";
import {DataService} from "@perfect-stack/nestjs-server/data/data.service";
import {QueryService} from "@perfect-stack/nestjs-server/data/query.service";


enum AgingStrategy {
    CONTINUOUS, // Age is calculated continuously from hatch date
    ANNIVERSARY, // Age increments on a specific date each year
}

enum AgeUnit {
    DAYS = 'days',
    MONTHS = 'months',
}

interface AgeBoundary {
    value: number;
    unit: AgeUnit;
}

interface AgeClassDefinition {
    name: string;
    // The upper, exclusive boundary of the age class.
    // The lower boundary is the `end` of the previous class in the array.
    // The first class starts at 0.
    // For the final class (e.g., 'Adult'), this can be omitted.
    end?: AgeBoundary;
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
                { name: 'Nestling', end: { value: 3, unit: AgeUnit.MONTHS } },
                { name: 'Fledgling', end: { value: 12, unit: AgeUnit.MONTHS } },
                { name: 'Juvenile', end: { value: 24, unit: AgeUnit.MONTHS } },
                { name: 'Subadult', end: { value: 36, unit: AgeUnit.MONTHS } },
                { name: 'Adult' },
            ]
        },
        'Kiwi': {
            strategy: AgingStrategy.CONTINUOUS,
            ageClasses: [
                // Example of mixing days and months for different life stages
                { name: 'Chick', end: { value: 50, unit: AgeUnit.DAYS } },
                { name: 'Juvenile', end: { value: 6, unit: AgeUnit.MONTHS } },
                { name: 'Subadult', end: { value: 48, unit: AgeUnit.MONTHS } },
                { name: 'Adult' },
            ]
        },
        // A default for other species. You can add more species-specific configs here.
        'Default': {
            strategy: AgingStrategy.CONTINUOUS,
            ageClasses: [
                { name: 'Nestling', end: { value: 3, unit: AgeUnit.MONTHS } },
                { name: 'Fledgling', end: { value: 12, unit: AgeUnit.MONTHS } },
                { name: 'Juvenile', end: { value: 24, unit: AgeUnit.MONTHS } },
                { name: 'Subadult', end: { value: 36, unit: AgeUnit.MONTHS } },
                { name: 'Adult' },
            ]
        }
    };

    constructor(
        protected readonly settingsService: SettingsService,
        protected readonly dataService: DataService,
        protected readonly queryService: QueryService,
    ) {}

    async getSummary(): Promise<any> {
        console.log('AgeClassBatchJob.getSummary()');
        const pool = await this.settingsService.getDatabasePool();
        const rows = await this.selectBirds(pool);
        console.log('AgeClassBatchJob.getSummary()');
        return {
            rowCount: rows.length
        }
    }

    async execute(): Promise<any> {
        console.log('AgeClassBatchJob.execute()');
        const pool = await this.settingsService.getDatabasePool();
        const rows = await this.selectBirds(pool);
        const result = await this.processRows(rows, pool);
        await pool.end();
        console.log('AgeClassBatchJob.execute() finished.');
        console.log('AgeClassBatchJob - Result: ', result);
        return;
    }

    async selectBirds(pool: Pool): Promise<any[]> {
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
            AND (b.age_class is null OR b.age_class != 'Adult') 
            AND b.status = 'Alive'
            AND b.data_source != 'SKYRANGER'
        `;
        const response = await pool.query(sql);
        const rows = response.rows;
        return rows;
    }

    async processRows(rows: any[], pool: Pool) {
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
                await this.updateAgeClass(birdId, newAgeClass, pool);
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

        // We need age in all possible units to perform comparisons.
        const ageInDays = this.getDaysDifference(hatchDate, demiseOrCurrentDate);
        let ageInMonths: number;

        // ANNIVERSARY strategy has special logic for calculating age in months.
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

        // A map to easily get the age value based on the unit.
        const ageByUnit = {
            [AgeUnit.DAYS]: ageInDays,
            [AgeUnit.MONTHS]: ageInMonths,
        };

        let lowerBoundary: AgeBoundary = { value: 0, unit: AgeUnit.DAYS }; // Start at 0 days.

        for (const ageClass of config.ageClasses) {
            const upperBoundary = ageClass.end;

            // Check if the current age is within the class boundaries.
            // Age >= lowerBoundary AND (no upperBoundary OR Age < upperBoundary)
            const ageAtLowerUnit = ageByUnit[lowerBoundary.unit];
            const isAfterOrOnLowerBoundary = ageAtLowerUnit >= lowerBoundary.value;

            let isBeforeUpperBoundary = false;
            if (!upperBoundary) {
                isBeforeUpperBoundary = true; // This is the last age class.
            } else {
                const ageAtUpperUnit = ageByUnit[upperBoundary.unit];
                isBeforeUpperBoundary = ageAtUpperUnit < upperBoundary.value;
            }

            if (isAfterOrOnLowerBoundary && isBeforeUpperBoundary) {
                return ageClass.name;
            }

            // The upper boundary of this class becomes the lower boundary of the next.
            if (upperBoundary) {
                lowerBoundary = upperBoundary;
            } else {
                // This was the last class, so we should have found a match.
                // If we are here, something is wrong, but we can break to be safe.
                break;
            }
        }

        return null;
    }

    /**
     * Calculates the number of full days between two dates.
     */
    private getDaysDifference(startDate: Date, endDate: Date): number {
        const diffTime = endDate.getTime() - startDate.getTime();
        return diffTime > 0 ? Math.floor(diffTime / (1000 * 60 * 60 * 24)) : 0;
    }

    /**
     * Calculates the number of full months between two dates.
     */
    private getMonthsDifference(startDate: Date, endDate: Date): number {
        let months;
        months = (endDate.getFullYear() - startDate.getFullYear()) * 12;
        months -= startDate.getMonth();
        months += endDate.getMonth();
        if (endDate.getDate() < startDate.getDate()) {
            months--;
        }
        return months <= 0 ? 0 : months;
    }

    async updateAgeClass(birdId: string, newAgeClass: string, pool: Pool): Promise<any> {
        const updateSql = "Update \"Bird\" set age_class = $1 where id = $2"
        await pool.query(updateSql, [newAgeClass, birdId]);
    }
}