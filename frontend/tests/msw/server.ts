/**
 * Node MSW server used by the Vitest integration suite. The server is
 * started once per test run via `tests/setup.ts` and handlers are reset
 * after every test.
 */

import { setupServer } from "msw/node";

import { defaultHandlers } from "./handlers";

export const server = setupServer(...defaultHandlers);
