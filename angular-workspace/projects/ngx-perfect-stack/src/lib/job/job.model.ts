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
  created_at: string;
  updated_at: string;
}
