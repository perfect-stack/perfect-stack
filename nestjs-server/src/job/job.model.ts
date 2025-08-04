

export interface JobModel {

    id: string;
    status: string;
    submitted_time: string;
    duration_ms: number;
    progress: number;
    request: string;
    response: string;
}