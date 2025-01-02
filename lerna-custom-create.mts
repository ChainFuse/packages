import { exec } from 'node:child_process';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, readdir, rename } from 'node:fs/promises';
import { basename, dirname, join, normalize, relative } from 'node:path';

class LernaCustomCreate {
	private static get arguments(): readonly string[] {
		return process.argv.slice(2);
	}

	public async createPackage(packageNameInput = LernaCustomCreate.arguments[0]) {
		if (packageNameInput) {
			const { packageName, packagePath } = await this.lernaCreate(packageNameInput);
			await Promise.all([this.customiseReadme(packagePath, packageNameInput), this.copyTemplate(packagePath), this.editPackageJson(packagePath).then(() => this.syncPackageFiles(packagePath)), this.renameFiles(packageName, packagePath)]);
		} else {
			throw new Error('No package name provided');
		}
	}

	private lernaCreate(packageName: string) {
		return new Promise<{
			packageName: string;
			packagePath: string;
		}>((resolve, reject) => {
			exec(['lerna', 'create', '--access public', '--es-module true', '--license Apache-2.0', '--yes', `@chainfuse/${packageName}`].join(' '), (error, stdout) => {
				if (error) {
					reject(new Error('lerna error', { cause: error }));
				} else {
					// Regex to match the package.json path
					const pathRegex = /Wrote to (.+package\.json)/i;
					const match = pathRegex.exec(stdout);

					if (match?.[1]) {
						// Normalize the path and get directory
						const packageJsonPath = normalize(match[1].trim());
						const packageDir = dirname(packageJsonPath);

						// Get relative path from current working directory
						const relativePath = relative(process.cwd(), packageDir);

						// Extract package name from the path
						const resolvedPackageName = basename(packageDir);

						console.info('Created', resolvedPackageName, 'at', relativePath);

						resolve({ packageName: resolvedPackageName, packagePath: relativePath });
					} else {
						reject(new Error('Package path not found in lerna output'));
					}
				}
			});
		});
	}

	private static async copyDirectory(srcDir: string, destDir: string) {
		await Promise.all([mkdir(destDir, { recursive: true }), readdir(srcDir, { withFileTypes: true })]).then(([, items]) =>
			Promise.all(
				items.map((item) => {
					const srcPath = join(srcDir, item.name);
					const destPath = join(destDir, item.name);

					if (item.isDirectory()) {
						console.info('Copying directory:', srcPath, 'to', destPath);
						return this.copyDirectory(srcPath, destPath);
					} else {
						console.info('Copying file:', srcPath, 'to', destPath);
						return this.copyFile(srcPath, destPath);
					}
				}),
			),
		);
	}

	private static copyFile(srcPath: string, destPath: string) {
		return new Promise<void>((resolve, reject) => {
			const readStream = createReadStream(srcPath);
			const writeStream = createWriteStream(destPath);

			readStream.on('error', reject);
			writeStream.on('error', reject);
			writeStream.on('finish', () => {
				console.info('File copied:', srcPath, 'to', destPath);
				resolve();
			});

			readStream.pipe(writeStream);
		});
	}

	private customiseReadme(packageDir: string, packageName: string) {
		const readmePath = join(packageDir, 'README.md');
		const tempFilePath = join(packageDir, 'README.temp.md');

		// Read the package.json file
		const readStream = createReadStream(readmePath, { encoding: 'utf8' });
		let fileData = '';

		readStream.on('data', (chunk) => (fileData += chunk));

		return new Promise<void>((resolve, reject) => {
			readStream.on('end', () => {
				try {
					fileData =
						[
							// Security
							['[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/ChainFuse/packages/badge)](https://securityscorecards.dev/viewer/?uri=github.com/ChainFuse/packages)', `[![Socket Badge](https://socket.dev/api/badge/npm/package/@chainfuse/${packageName})](https://socket.dev/npm/package/@chainfuse/${packageName})`].join(''),
							// NPM
							[`![NPM Downloads](${new URL(`https://img.shields.io/npm/dw/@chainfuse/${packageName}`).href})`, `![npm bundle size](${new URL(`https://img.shields.io/bundlephobia/min/@chainfuse/${packageName}`).href})`, `![NPM Unpacked Size](${new URL(`https://img.shields.io/npm/unpacked-size/@chainfuse/${packageName}`).href})`].join(''),
							// CI/CD
							['[![Build & Test](https://github.com/ChainFuse/packages/actions/workflows/test.yml/badge.svg)](https://github.com/ChainFuse/packages/actions/workflows/test.yml)', '[![Release](https://github.com/ChainFuse/packages/actions/workflows/changeset-release.yml/badge.svg)](https://github.com/ChainFuse/packages/actions/workflows/changeset-release.yml)'].join(''),
						].join('\n\n') +
						'\n\n' +
						fileData;

					// Write the updated JSON back to a temporary file
					const writeStream = createWriteStream(tempFilePath, { encoding: 'utf8' });
					writeStream.write(fileData);
					writeStream.end();

					writeStream.on('finish', () => resolve());
				} catch (error) {
					reject(error);
				}
			});
		}).then(() =>
			rename(tempFilePath, readmePath).catch((e) => {
				throw e;
			}),
		);
	}

	private copyTemplate(packageDir: string, templateDir: string = relative(process.cwd(), 'template')) {
		return LernaCustomCreate.copyDirectory(templateDir, packageDir);
	}

	private editPackageJson(packageDir: string) {
		const packageJsonPath = join(packageDir, 'package.json');
		const tempFilePath = join(packageDir, 'package.temp.json');

		// Read the package.json file
		const readStream = createReadStream(packageJsonPath, { encoding: 'utf8' });
		let fileData = '';

		readStream.on('data', (chunk) => (fileData += chunk));

		return new Promise<void>((resolve, reject) => {
			readStream.on('end', () => {
				try {
					const json = JSON.parse(fileData);

					// Make your changes to the json object here
					json.version = '0.0.0';
					json.description = '';
					delete json.keywords;
					json.type = 'module';
					json.main = './dist/index.mjs';
					delete json.module;
					json.types = './dist/index.d.mts';
					json.publishConfig.provenance = true;
					json.scripts = {
						fmt: 'prettier --check .',
						'fmt:fix': 'prettier --write .',
						lint: 'eslint .',
						'lint:fix': 'npm run lint -- --fix',
						clean: 'npx -y rimraf@latest ./dist ./.tsbuildinfo',
						build: 'tsc',
						'build:clean': 'npm run build -- --build --clean && npm run build',
						pretest: 'tsc --project tsconfig.tests.json',
						test: 'node --enable-source-maps --test --experimental-test-coverage --test-reporter=spec --test-reporter-destination=stdout',
					};
					json.author = 'ChainFuse';
					json.engines = {
						node: `>=${process.version.replace(/^v/, '')}`,
					};
					json.exports = {
						'.': {
							import: './dist/index.mjs',
							types: './dist/index.d.mts',
						},
					};
					json.prettier = '@demosjarco/prettier-config';
					json.dependencies = {};
					json.devDependencies = {};
					json.optionalDependencies = {};

					// Write the updated JSON back to a temporary file
					const writeStream = createWriteStream(tempFilePath, { encoding: 'utf8' });
					writeStream.write(JSON.stringify(json, null, '\t'));
					writeStream.end();

					writeStream.on('finish', () => resolve());
				} catch (error) {
					reject(error);
				}
			});
		}).then(() =>
			rename(tempFilePath, packageJsonPath).catch((e) => {
				throw e;
			}),
		);
	}

	private static renameFile(oldPath: string, newPath: string) {
		return rename(oldPath, newPath)
			.then(() => console.log(`Renamed: ${oldPath} to ${newPath}`))
			.catch((e) => {
				throw e;
			});
	}

	private async renameFiles(packageName: string, packageDir: string) {
		const srcJsFilePath = join(packageDir, 'src', `${packageName}.js`);
		const srcMtsFilePath = join(packageDir, 'src', `${packageName}.mts`);

		const testJsFilePath = join(packageDir, '__tests__', `${packageName}.test.js`);
		const testMtsFilePath = join(packageDir, '__tests__', `${packageName}.test.mts`);

		await Promise.all([LernaCustomCreate.renameFile(srcJsFilePath, srcMtsFilePath), LernaCustomCreate.renameFile(testJsFilePath, testMtsFilePath)]);
	}

	private syncPackageFiles(packagePath: string) {
		return new Promise<void>((resolve, reject) => {
			exec(['npm', 'install'].join(' '), { cwd: packagePath }, (error, _stdout, _stderr) => {
				if (error) {
					reject(new Error('Error syncing package files', { cause: error }));
				} else {
					console.info(`Package files synced for ${packagePath}`);
					resolve();
				}
			});
		});
	}
}

await new LernaCustomCreate().createPackage();
