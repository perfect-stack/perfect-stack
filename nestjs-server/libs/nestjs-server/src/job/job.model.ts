

export interface Job {
    id: string;
    name: string;
    status: "Submitted" | "Processing" | "Completed";
    data: string;
    step_index: number;
    step_count: number;
    duration: number;
    created_at: string;
    updated_at: string;
}