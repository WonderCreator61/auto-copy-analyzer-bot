import { queryForAllWalletsFinder } from "../query";
import { DUNE_QUERY_ID, STORE } from "../utils/constants";
import { writeFile } from "../utils/file";
import { sleep } from "../utils/helper";
import { sendQueryExecutionRequest, getExecutionStatus, getExecutionResult, updateQuery } from "./api";

export const executeQuery = async (queryId: number) => {
  if (STORE.QUERY_RUNNING) return;
  STORE.QUERY_RUNNING = true;

  const execution = await sendQueryExecutionRequest(queryId);
  if (!execution) {
    console.error("Execution Query Failed!");
    return;
  }

  let { execution_id, state } = execution;
  while (state !== "QUERY_STATE_COMPLETED") {
    const executionStatus = await getExecutionStatus(execution_id);
    if (!executionStatus) {
      break;
    }
    state = executionStatus.state;
    console.info("Query State: ", state);

    if (executionStatus.state === "QUERY_STATE_FAILED") {
      break;
    }
    await sleep(20);
  }

  STORE.QUERY_RUNNING = false;

  if (state !== "QUERY_STATE_COMPLETED") {
    console.error("Execution Failed!");
    return;
  }

  console.info("Query Executed Successfully!");

  const executionResult = await getExecutionResult(execution_id);
  if (!executionResult) {
    console.error("Execution Result Query Failed!");
    return;
  }

  return executionResult.result;

};

export const runQueryAndGetResult = async () => {
  const query = queryForAllWalletsFinder();

  try {
    await updateQuery(Number(DUNE_QUERY_ID), query);
    console.log("Query updated successfully");
  } catch (error) {
    console.log("Failed to update query", error);
    return;
  }

  const queryExecutionResult = await executeQuery(Number(DUNE_QUERY_ID));
  const resultWallets = queryExecutionResult?.rows as Array<{ [key: string]: string | number }>;

  await writeFile("targets", resultWallets);
};
