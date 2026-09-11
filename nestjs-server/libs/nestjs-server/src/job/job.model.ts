export interface Job {
    id: string;
    name: string;
    status: "Submitted" | "Processing" | "Completed" | "Error";
    status_message?: string;
    data: string;
    step_index: number;
    step_count: number;
    duration: number;
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
    executeStep(job: Job, stepIndex: number): Promise<void>;
    onComplete?(job: Job): Promise<void>;
}

export type JobHandler = TaskJobHandler | StepJobHandler;
