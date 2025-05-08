import { defineConfig } from "bunup";

export default defineConfig([
  {
    entry: ["src/node.ts"],
    format: ["esm"],
    dts: false,
    minify: true,
    target: "node",
  },
  {
    entry: ["src/bun.ts"],
    format: ["esm"],
    dts: false,
    minify: true,
    target: "bun",
  },
]);
