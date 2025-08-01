

export enum JobStatus {
    IN_PROGRESS,
    COMPLETE,
    FAILED
}



export class Job {

    id: string;
    status: JobStatus
    result: string;
}