export interface Job {
  id: string;
  name: string;
  status: "Submitted" | "Processing" | "Completed" | "Stopped" | "Error";
  status_message?: string;
  data: string;
  step_index: number;
  step_count: number;
  chunk_size?: number;
  duration: number;
  result_summary?: string;
  created_at: string;
  updated_at: string;
}
