# effect-grep

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.2.10. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

## Test

```sh
bun run build && bun dist/bun.js -- -n -C 1 -i dist ./test.txt
```
