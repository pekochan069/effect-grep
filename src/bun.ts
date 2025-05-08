import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Effect } from "effect";
import { cli } from "./cli";

cli(process.argv).pipe(Effect.provide(BunContext.layer), BunRuntime.runMain);
