import { resolve } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'
import pckg from "./package.json"

export default defineConfig({
	build: {
		lib: {
			entry: {
				"": resolve(__dirname, "src/index.ts"),
			},
			name: pckg.name,
			fileName: (format, entryName) => {
				return `${format}/${entryName ? `${entryName}/` : ""}index.js`;
			},
			formats: ["cjs", "esm"],
		},
		rollupOptions: {
			external: [
				"bootstrap",
				"react",
				"react-bootstrap",
				"react-dom"
			],
			output: {
				globals: {
					bootstrap: "bootstrap",
					"react": "React",
					"react-bootstrap": "ReactBootstrap",
				}
			}
		},
		minify: false,
		outDir: "./dist"
	},
	plugins: [
		react()
	]
});