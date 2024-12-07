import tseslint from 'typescript-eslint';
import rootConfig from '../../eslint.config.mjs';

export default tseslint.config({
	extends: [...rootConfig],
	languageOptions: {
		parserOptions: {
			projectService: {
				allowDefaultProject: ['eslint.config.mjs', '__tests__/*'],
			},
			tsconfigRootDir: import.meta.dirname,
		},
	},
});
