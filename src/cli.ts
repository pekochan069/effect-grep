import { Args, Command, Options } from "@effect/cli";
import { FileSystem, Terminal } from "@effect/platform";
import { Effect } from "effect";
import { version } from "../version";

type GrepOptions = {
  ignoreCase: boolean;
  lineNumber: boolean;
  maxCount: number;
  beforeContext: number;
  afterContext: number;
  groupSeparator: string;
  noGroupSeparator: boolean;
};

export const readFile = (path: string) =>
  Effect.gen(function* (_) {
    const fs = yield* FileSystem.FileSystem;

    if (!fs.exists(path)) {
      return null;
    }

    const content = yield* fs.readFileString(path, "utf8");
    return content;
  });

const print = (text: string) =>
  Effect.gen(function* (_) {
    const terminal = yield* Terminal.Terminal;
    yield* terminal.display(text + "\n");
  });

const printLines = (lines: string[]) =>
  Effect.gen(function* (_) {
    const terminal = yield* Terminal.Terminal;
    yield* terminal.display(lines.join("\n") + "\n");
  });

const createRegexFlags = (options: GrepOptions) => {
  let regexFlags = "g";
  if (options.ignoreCase) {
    regexFlags += "i";
  }

  return regexFlags;
};

const grep = (pattern: string, content: string, options: GrepOptions) =>
  Effect.gen(function* (_) {
    const lines = content.split("\n");
    const outputs: string[][] = [];

    const regex = new RegExp(pattern, createRegexFlags(options));

    for (let i = 0; i < lines.length; ++i) {
      if (options.maxCount >= 0 && options.maxCount <= outputs.length) {
        break;
      }

      const output: string[] = [];
      const line = lines[i]!;

      if (line.match(regex)) {
        const min = Math.max(0, i - options.beforeContext);
        const max = Math.min(lines.length - 1, i + options.afterContext);

        // Append output
        for (let j = min; j < i; ++j) {
          if (options.lineNumber) {
            output.push(`${j + 1}:` + lines[j]!);
          } else {
            output.push(lines[j]!);
          }
        }
        if (options.lineNumber) {
          output.push(`${i + 1}:` + line);
        } else {
          output.push(line);
        }
        for (let j = i + 1; j <= max; ++j) {
          if (options.lineNumber) {
            output.push(`${j + 1}:` + lines[j]!);
          } else {
            output.push(lines[j]!);
          }
        }

        outputs.push(output);
      }
    }

    for (let i = 0; i < outputs.length; ++i) {
      yield* printLines(outputs[i]!);

      if (
        !options.noGroupSeparator &&
        (options.beforeContext > 0 || options.afterContext > 0) &&
        i < outputs.length - 1
      ) {
        yield* print(options.groupSeparator);
      }
    }
  });

const program = (pattern: string, files: string[], options: GrepOptions) =>
  Effect.gen(function* () {
    const terminal = yield* Terminal.Terminal;
    for (const file of files) {
      const fileContent = yield* readFile(file);

      if (fileContent === null) {
        yield* terminal.display("File not found");
        continue;
      }

      yield* grep(pattern, fileContent, options);
    }
  });

const ignoreCase = Options.boolean("ignore-case").pipe(Options.withAlias("i"));
const noIgnoreCase = Options.boolean("no-ignore-case").pipe(Options.withDefault(true));
const lineNumber = Options.boolean("line-number").pipe(Options.withAlias("n"));
const maxCount = Options.integer("max-count").pipe(Options.withAlias("m"), Options.withDefault(-1));
const beforeContext = Options.integer("before-context").pipe(Options.withAlias("B"), Options.withDefault(0));
const afterContext = Options.integer("after-context").pipe(Options.withAlias("A"), Options.withDefault(0));
const context = Options.integer("context").pipe(
  Options.withAlias("C"),
  Options.withAlias("NUM"),
  Options.withDefault(0)
);
const groupSeparator = Options.text("group-separator").pipe(Options.withDefault("--"));
const noGroupSeparator = Options.boolean("no-group-separator");
const pattern = Args.text({ name: "pattern" });
const files = Args.path({
  name: "file",
}).pipe(Args.repeated);

const command = Command.make(
  "grep",
  {
    ignoreCase,
    noIgnoreCase,
    lineNumber,
    maxCount,
    beforeContext,
    afterContext,
    context,
    groupSeparator,
    noGroupSeparator,
    pattern,
    files,
  },
  ({
    ignoreCase,
    noIgnoreCase,
    lineNumber,
    maxCount,
    beforeContext,
    afterContext,
    context,
    groupSeparator,
    noGroupSeparator,
    pattern,
    files,
  }) => {
    const options: GrepOptions = {
      ignoreCase: noIgnoreCase ? false : ignoreCase,
      lineNumber,
      maxCount,
      beforeContext: beforeContext > 0 ? beforeContext : context,
      afterContext: afterContext > 0 ? afterContext : context,
      groupSeparator,
      noGroupSeparator,
    };

    return program(pattern, files, options);
  }
);

export const cli = Command.run(command, {
  name: "Effect Grep",
  version,
});
