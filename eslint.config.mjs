import path from "node:path"
import globals from "globals"
import eslint from "@eslint/js"
import { fileURLToPath } from "node:url"
import security from "eslint-plugin-security"
import { FlatCompat } from "@eslint/eslintrc"
import tsParser from "@typescript-eslint/parser"
import typescriptEslint from "@typescript-eslint/eslint-plugin"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: eslint.configs.recommended,
	allConfig: eslint.configs.all
})

export default [
	...compat.extends("eslint:recommended", "plugin:@typescript-eslint/recommended"),
	{
		plugins: {
			security,
			"@typescript-eslint": typescriptEslint,
		},
		languageOptions: {
			globals: {
				...globals.node,
			},
			ecmaVersion: "latest",
			sourceType: "module",
		},
		rules: {
			indent: ["error", "tab"],
			"linebreak-style": ["error", "unix"],
			quotes: ["error", "double"],
			semi: ["error", "never"],
			"no-empty": ["error", {
				allowEmptyCatch: true,
			}],
			"eol-last": ["error", "always"],
			"no-unused-vars": "off",
			"@typescript-eslint/no-unused-vars": "warn",
			eqeqeq: "error",
			"space-infix-ops": "warn",
			"space-before-blocks": "error",
			"keyword-spacing": ["error", {
				before: true,
				after: true,
			}],
			"no-trailing-spaces": "error",
			"prefer-const": "error",
			"max-len": ["error", {
				code: 140,
			}],
			"@typescript-eslint/explicit-function-return-type": "warn",
			"require-await": "error",
			"@typescript-eslint/no-explicit-any": "error",
			"@typescript-eslint/prefer-as-const": "error",
			"no-eval": "error",
			"no-duplicate-imports": "error",
			"no-var": "error",
			"prefer-spread": "error",
			"@typescript-eslint/no-empty-interface": "error",
			"max-depth": ["warn", 3],
			"no-nested-ternary": "error",
			complexity: ["warn", 9],
			"no-shadow": "off",
			"@typescript-eslint/no-shadow": "error",
			"@typescript-eslint/no-non-null-assertion": "error",
			"max-params": ["warn", 6],
			"max-lines-per-function": ["warn", {
				max: 40,
				skipBlankLines: true,
				skipComments: true,
			}],
			"@typescript-eslint/naming-convention": ["error", {
				selector: "variable",
				format: ["camelCase"],
			}, {
				selector: "variable",
				modifiers: ["destructured"],
				filter: {
					regex: "GOOGLE_CLIENT_ID|GOOGLE_CLIENT_SECRET",
					match: true,
				},
				format: null,
			}, {
				selector: "variable",
				filter: {
					regex: "PORT",
					match: true,
				},
				format: null,
			},{
				selector: "function",
				format: ["camelCase"],
			}, {
				selector: "parameter",
				format: ["camelCase"],
				leadingUnderscore: "allow"
			}, {
				selector: "typeLike",
				format: ["PascalCase"],
			}],
			"security/detect-buffer-noassert": "warn",
			"security/detect-child-process": "warn",
			"security/detect-disable-mustache-escape": "warn",
			"security/detect-eval-with-expression": "warn",
			"security/detect-no-csrf-before-method-override": "warn",
			"security/detect-non-literal-fs-filename": "warn",
			"security/detect-non-literal-regexp": "warn",
			"security/detect-non-literal-require": "warn",
			"security/detect-possible-timing-attacks": "warn",
			"security/detect-pseudoRandomBytes": "warn",
			"security/detect-unsafe-regex": "warn",
		},
	},
	{
		files: ["**/*.ts"],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				project: ["./tsconfig.json"]
			},
		},
		rules: {
			"@typescript-eslint/no-unnecessary-condition": "warn",
			"@typescript-eslint/no-floating-promises": "warn",
		},
	},
	{
		files: ["eslint.config.mjs"],
		rules: {
			"@typescript-eslint/naming-convention": "off",
		},
	},
	{
		ignores: ["dist/*"]
	}
]
