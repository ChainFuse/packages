import tseslint from 'typescript-eslint';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import rootConfig from '../eslint.config.mjs';

const configDir = dirname(fileURLToPath(import.meta.url));
const tsconfigRootDir = basename(configDir) === 'template' ? resolve(configDir, '..') : configDir;

export default tseslint.config({
	extends: [...rootConfig],
	languageOptions: {
		parserOptions: {
			projectService: {
				allowDefaultProject: ['eslint.config.mjs', '__tests__/*'],
			},
			tsconfigRootDir,
		},
	},
});
