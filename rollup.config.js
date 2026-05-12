import typescript from "@rollup/plugin-typescript"
import dts from "rollup-plugin-dts"

const tsPlugin = () =>
  typescript({ tsconfig: "./tsconfig.json", declaration: false })

export default [
  {
    input: "src/index.ts",
    output: [
      { file: "dist/index.esm.js", format: "esm", sourcemap: true },
      {
        file: "dist/index.cjs.js",
        format: "cjs",
        sourcemap: true,
        exports: "named",
      },
    ],
    plugins: [tsPlugin()],
  },
  {
    input: "src/index.ts",
    output: { file: "dist/index.d.ts", format: "esm" },
    plugins: [dts()],
  },
]
