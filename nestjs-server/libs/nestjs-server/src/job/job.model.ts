export interface Job {
    id: string;
    name: string;
    status: "Submitted" | "Processing" | "Completed" | "Stopped" | "RolledBack" | "Error";
    status_message?: string;
    data: string;
    step_index: number;
    step_count: number;
    chunk_size?: number;
    duration: number;
    result_summary?: string;
    filename?: string;
    executed_by?: string;
    data_format?: string;
    row_count?: number;
    imported_count?: number;
    error_count?: number;
    valid_count?: number;
    skipped_count?: number;
    created_at: Date;
    updated_at: Date;
}

export interface JobExecutionContext {
    readonly job: Job;
    updateProgress(stepIndex: number, stepCount?: number, statusMessage?: string): Promise<void>;
    setSummary(summary: any): void;
}

export interface BaseJobHandler {
    getSummary?(): Promise<any>;
    showInBatchUI?(): boolean;
}

export interface TaskJobHandler extends BaseJobHandler {
    readonly type?: 'task';
    execute(context?: JobExecutionContext): Promise<any>;
}

export interface StepJobHandler extends BaseJobHandler {
    readonly type: 'step';
    readonly chunkSize?: number;
    executeStep(job: Job, stepIndex: number, chunkSize?: number): Promise<void>;
    onComplete?(job: Job): Promise<void>;
}

export type JobHandler = TaskJobHandler | StepJobHandler;
