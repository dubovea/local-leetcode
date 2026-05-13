import {
  CustomFunction,
  Employee,
  Iterator,
  ListNode,
  Master,
  MountainArray,
  Node,
  NestedInteger,
  TreeNode,
  _Node,
} from "./structures.js";
import { createMemoryTracker } from "./runnerMetrics.js";
import { transformInputJS } from "./runnerTypeTransforms.js";

export function compileUserCode(code, functionName, consoleApi) {
  const memoryTracker = createMemoryTracker();
  const factory = Function(
    "console",
    "Array",
    "Map",
    "Set",
    "ListNode",
    "TreeNode",
    "Node",
    "_Node",
    "Employee",
    "NestedInteger",
    "Iterator",
    "MountainArray",
    "CustomFunction",
    "Master",
    `"use strict";\n${code}\n; return typeof ${functionName} !== "undefined" ? ${functionName} : undefined;`,
  );
  const solution = factory(
    consoleApi,
    memoryTracker.Array,
    memoryTracker.Map,
    memoryTracker.Set,
    ListNode,
    TreeNode,
    Node,
    _Node,
    Employee,
    NestedInteger,
    Iterator,
    MountainArray,
    CustomFunction,
    Master,
  );

  if (typeof solution !== "function") {
    throw new Error(`Function "${functionName}" was not found`);
  }

  return { solution, memoryTracker };
}

export function executeDesignCase(Constructor, designCase, code) {
  const [constructorArgs = [], ...methodArgs] = designCase.args;
  const instance = new Constructor(...transformInputJS(constructorArgs, code));
  const output = [null];

  for (let index = 1; index < designCase.operations.length; index += 1) {
    const methodName = designCase.operations[index];
    const method = instance[methodName];

    if (typeof method !== "function") {
      throw new Error(`Method "${methodName}" was not found`);
    }

    const result = method.apply(instance, methodArgs[index - 1] ?? []);
    output.push(typeof result === "undefined" ? null : result);
  }

  return output;
}
