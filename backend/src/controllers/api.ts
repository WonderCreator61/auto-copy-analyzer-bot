import { TExecuteQueryResponse, TGetExecutionResultResponse, TGetExecutionStatusResponse } from "../types/dune";
import { DUNE_API_KEY } from "../utils/constants";

export const updateQuery = async (queryId: number, query: string) => {
    const options = {
      method: "PATCH",
      headers: {
        "X-DUNE-API-KEY": DUNE_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query_id: queryId, query_sql: query }),
    };
    return await fetch(
      "https://api.dune.com/api/v1/query/" + queryId,
      options
    ).then((response) => response.json());
  };
  
  export const sendQueryExecutionRequest = async (queryId: number) => {
    const options = {
      method: "POST",
      headers: { "X-DUNE-API-KEY": process.env.DUNE_API_KEY! },
    };
    try {
      const response: TExecuteQueryResponse = await fetch(
        `https://api.dune.com/api/v1/query/${queryId}/execute`,
        options
      ).then((response) => response.json());
      return response;
    } catch (error) {
      console.error("Execute Query Error: ", error);
      return null;
    }
  }
  
  export async function getExecutionStatus(executionId: string) {
    const options = {
      method: "GET",
      headers: { "X-DUNE-API-KEY": process.env.DUNE_API_KEY! },
    };
    try {
      const response: TGetExecutionStatusResponse = await fetch(
        `https://api.dune.com/api/v1/execution/${executionId}/status`,
        options
      ).then((response) => response.json());
      return response;
    } catch (error) {
      console.error("Get Execution Status: ", error);
      return null;
    }
  }
  
  export async function getExecutionResult(executionId: string) {
    const options = {
      method: "GET",
      headers: { "X-DUNE-API-KEY": process.env.DUNE_API_KEY! },
    };
    try {
      const response: TGetExecutionResultResponse = await fetch(
        `https://api.dune.com/api/v1/execution/${executionId}/results`,
        options
      ).then((response) => response.json());
      return response;
    } catch (error) {
      console.error("Get Execution Result: ", error);
      return null;
    }
  }