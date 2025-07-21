export type TExecuteQueryResponse = {
  execution_id: string;
  state:
    | "QUERY_STATE_COMPLETED"
    | "QUERY_STATE_PENDING"
    | "QUERY_STATE_EXECUTING"
    | "QUERY_STATE_FAILED"
    | "QUERY_STATE_CANCELED"
    | "QUERY_STATE_EXPIRED"
    | "QUERY_STATE_COMPLETED_PARTIAL";
};

export type TGetExecutionStatusResponse = {
  cancelled_at: string;
  execution_ended_at: string;
  execution_id: string;
  execution_started_at: string;
  expires_at: string;
  is_execution_finished: true;
  max_inflight_interactive_executions: number;
  max_inflight_interactive_reached: number;
  query_id: number;
  queue_position: number;
  result_metadata: {
    column_names: Array<string>;
    column_types: Array<string>;
    datapoint_count: number;
    execution_time_millis: number;
    pending_time_millis: number;
    result_set_bytes: number;
    row_count: number;
    total_result_set_bytes: number;
    total_row_count: number;
  };
  state:
    | "QUERY_STATE_COMPLETED"
    | "QUERY_STATE_PENDING"
    | "QUERY_STATE_EXECUTING"
    | "QUERY_STATE_FAILED"
    | "QUERY_STATE_CANCELED"
    | "QUERY_STATE_EXPIRED"
    | "QUERY_STATE_COMPLETED_PARTIAL";
  submitted_at: string;
};

export type TGetExecutionResultResponse = {
  cancelled_at: string;
  execution_ended_at: string;
  execution_id: string;
  execution_started_at: string;
  expires_at: string;
  is_execution_finished: boolean;
  next_offset: number;
  next_uri: string;
  query_id: number;
  result: {
    metadata: {
      column_names: Array<string>;
      column_types: Array<string>;
      datapoint_count: number;
      execution_time_millis: number;
      pending_time_millis: number;
      result_set_bytes: number;
      row_count: number;
      total_result_set_bytes: number;
      total_row_count: number;
    };
    rows: Array<any>;
  };
  state:
    | "QUERY_STATE_COMPLETED"
    | "QUERY_STATE_PENDING"
    | "QUERY_STATE_EXECUTING"
    | "QUERY_STATE_FAILED"
    | "QUERY_STATE_CANCELED"
    | "QUERY_STATE_EXPIRED"
    | "QUERY_STATE_COMPLETED_PARTIAL";
  submitted_at: string;
};
