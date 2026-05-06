// Desabilitar TypeScript project mode em desenvolvimento para melhorar performance
// O type-checking completo é muito lento durante desenvolvimento
const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
	ignorePatterns: ['next.config.mjs'],
	extends: [
		'next/core-web-vitals',
		'prettier',
		'plugin:import/recommended',
		'plugin:import/typescript',
		'plugin:react/recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:@tanstack/eslint-plugin-query/recommended',
	],
	plugins: [
		'react',
		'import',
		'@typescript-eslint/eslint-plugin',
		'prettier',
		'@tanstack/query',
		'unused-imports',
	],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		// Desabilitar project mode em dev para melhorar performance
		// Em produção/CI, o type-checking completo ainda será executado
		project: isProduction ? './tsconfig.json' : false,
		ecmaVersion: 'latest',
		sourceType: 'module',
	},
	settings: {
		'import/resolver': {
			typescript: isProduction
				? {
						project: ['tsconfig.json'],
					}
				: {
						// Em desenvolvimento, resolver sem type-checking completo
						alwaysTryTypes: true,
					},
		},
		'import/internal-regex': '^(components|theme)',
	},
	rules: {
		'@typescript-eslint/no-explicit-any': 'off',
		'unused-imports/no-unused-imports': 'error',
		'prettier/prettier': ['error'],
		'react/react-in-jsx-scope': 'off',
		'import/no-anonymous-default-export': 'off',
		'react/prop-types': 'off',
		'react-hooks/rules-of-hooks': 'error',
		'react-hooks/exhaustive-deps': 'warn',
	},
};

