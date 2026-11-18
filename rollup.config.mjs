import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import babel from "@rollup/plugin-babel";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import postcss from "rollup-plugin-postcss";
import sass from "sass";
import fs from "fs";

const babelPlugin = () =>
  babel({
    babelHelpers: "bundled",
    presets: ["@babel/preset-react", "@babel/preset-typescript"],
    extensions: [".ts", ".tsx"],
  });

/**
 * A preset published as its own subpath (`smartr-ui/presets/<name>`):
 * pure data — no React, no configManager singleton, no Bootstrap classes
 * (it only imports `config/sharedConfig` and `presets/tailwindGrid`); types
 * are emitted by the main build at dist/presets/<name>.d.ts.
 *   <name>.js     — CommonJS (require, Jest, Tailwind config files)
 *   <name>.mjs    — ES module for native Node ESM (`exports` "import")
 *   <name>.esm.js — ES module for bundlers / nested package.json "module"
 *   <name>.d.mts  — ESM-flavoured types for TypeScript node16/nodenext
 */
const presetEntry = (name) => ({
  input: `src/presets/${name}.ts`,
  output: [
    {
      file: `dist/presets/${name}.js`,
      format: "cjs",
      exports: "named",
      sourcemap: true,
    },
    {
      file: `dist/presets/${name}.esm.js`,
      format: "esm",
      exports: "named",
      sourcemap: true,
    },
    {
      file: `dist/presets/${name}.mjs`,
      format: "esm",
      exports: "named",
      sourcemap: true,
    },
  ],
  plugins: [
    {
      name: `emit-${name}-d-mts`,
      writeBundle() {
        fs.mkdirSync("dist/presets", { recursive: true });
        fs.writeFileSync(
          `dist/presets/${name}.d.mts`,
          `export * from "./${name}.js";
`
        );
      },
    },
    peerDepsExternal(),
    resolve(),
    commonjs(),
    typescript({
      tsconfig: "./tsconfig.json",
      declaration: false,
      outDir: "dist/presets",
    }),
    babelPlugin(),
  ],
});

// Start from an empty dist/: chunk file names are content-hashed and
// declaration files of removed sources would otherwise linger, and everything
// under dist/ is packed.
fs.rmSync("dist", { recursive: true, force: true });

/** Lazy chunks keep their module name; the code shared by both entries is "shared". */
const chunkName = (extension) => (chunk) =>
  /^(AsyncSelect|File)$/.test(chunk.name)
    ? `chunks/[name]-[hash]${extension}`
    : `chunks/shared-[hash]${extension}`;

export default [
  // Main entries: smartr-ui (dist/index.*), smartr-ui/core (dist/core.*) and
  // smartr-ui/config (dist/config.*). Built together so they share chunks
  // (dist/chunks/*): one configuration singleton and one SmartRProvider context
  // whichever entry is imported. `core` lazy-loads the async select / file
  // controls (separate chunks); `config` contains no component code.
  {
    input: {
      index: "src/index.ts",
      core: "src/core.ts",
      config: "src/config.ts",
    },
    output: [
      {
        dir: "dist",
        format: "cjs",
        exports: "named",
        sourcemap: true,
        entryFileNames: "[name].js",
        chunkFileNames: chunkName(".js"),
      },
      {
        dir: "dist",
        format: "esm",
        exports: "named",
        sourcemap: true,
        entryFileNames: "[name].esm.js",
        chunkFileNames: chunkName(".esm.js"),
      },
    ],
    plugins: [
      peerDepsExternal(),
      resolve(),
      commonjs(),
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: true,
        declarationDir: "dist",
      }),
      babelPlugin(),
      postcss({
        extract: false, // CSS embedded in the JS bundle
        minimize: true,
        modules: {
          // CSS Modules
          generateScopedName: "[name]__[local]--[hash:base64:5]",
        },
        use: {
          sass: sass,
        },
      }),
    ],
  },
  // Separate entries: smartr-ui/presets/tailwind and smartr-ui/presets/shadcn
  presetEntry("tailwind"),
  presetEntry("shadcn"),
];
