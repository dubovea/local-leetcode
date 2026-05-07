import { runUserCode } from "../model/runnerCore.js";
import type { RunRequest } from "@/entities/problem/model/types";

self.addEventListener("message", async (event: MessageEvent<RunRequest>) => {
  const result = await runUserCode(event.data);
  self.postMessage(result);
});
