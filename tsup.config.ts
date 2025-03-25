import { defineConfig } from "tsup";
import { sassPlugin } from "esbuild-sass-plugin";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true, // ✅ Automatically generates TypeScript declarations
  sourcemap: true,
  splitting: false,
  clean: true,
  minify: true,
  esbuildPlugins: [sassPlugin()],
});
