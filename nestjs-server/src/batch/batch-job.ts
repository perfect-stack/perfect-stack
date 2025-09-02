
export interface BatchJob {
    getSummary(): Promise<any>;
    execute(): Promise<any>;
}
