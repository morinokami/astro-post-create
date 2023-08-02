import fs from 'node:fs';

import * as p from '@clack/prompts';
import { execa } from 'execa';
import latestVersion from 'latest-version';
import color from 'picocolors';
import { type NormalizedPackageJson, readPackage } from 'read-pkg';
import detectPackageManager from 'which-pm-runs';
import { addPackageDependencies } from 'write-pkg';

import * as conf from './conf';

async function main() {
	// Is there a package.json?
	let pkgJson: NormalizedPackageJson | undefined;
	try {
		pkgJson = await readPackage();
	} catch (err) {
		console.error(
			'No package.json found. Please run this command in the root of your Astro project.',
		);
		process.exit(1);
	}
	// Is this an Astro project?
	const astroInstalled = pkgJson.dependencies?.astro !== undefined;
	if (!astroInstalled) {
		console.error(
			'Astro not found. Please run this command in an Astro project.',
		);
		process.exit(1);
	}
	// What package manager is used?
	const pkgManager = detectPackageManager()?.name ?? 'npm';

	console.clear();
	p.intro(`${color.bgCyan(color.black(' astro-post-create '))}`);

	const config = await p.group(
		{
			tools: () =>
				p.multiselect({
					message: 'Which tools do you want to use?',
					options: [
						{ value: 'prettier', label: 'Prettier' },
						{ value: 'eslint', label: 'ESLint' },
					],
					required: true,
				}),
			generate: () =>
				p.confirm({
					message: 'Generate config files?',
					initialValue: false,
				}),
			install: () =>
				p.confirm({
					message: 'Install dependencies?',
					initialValue: false,
				}),
		},
		{
			onCancel: () => {
				p.cancel('Operation cancelled.');
				process.exit(0);
			},
		},
	);

	// Update package.json
	const cwd = process.cwd();
	let s = p.spinner();
	s.start('Updating package.json');
	try {
		const deps: Record<string, Promise<string>> = {};
		for (const tool of config.tools) {
			if (tool === 'prettier') {
				deps.prettier = latestVersion('prettier');
				deps['prettier-plugin-astro'] = latestVersion('prettier-plugin-astro');
			}
			if (tool === 'eslint') {
				deps.eslint = latestVersion('eslint');
				deps['eslint-plugin-astro'] = latestVersion('eslint-plugin-astro');
				deps['@typescript-eslint/eslint-plugin'] = latestVersion(
					'@typescript-eslint/eslint-plugin',
				);
			}
		}
		const resolvedDeps = await Promise.all(
			Object.entries(deps).map(async ([name, versionPromise]) => {
				const version = await versionPromise;
				return [name, version];
			}),
		);
		await addPackageDependencies(cwd, {
			devDependencies: Object.fromEntries(resolvedDeps),
		});
	} catch (err) {
		console.error('Failed to update package.json');
		process.exit(1);
	}
	s.stop('Updated package.json');

	// Generate config files
	if (config.generate) {
		let skipped = true;
		s = p.spinner();
		s.start('Generating config files');
		for (const tool of config.tools) {
			// Don't overwrite existing config files
			if (
				tool === 'prettier' &&
				!fs.existsSync('./.prettierrc') &&
				!fs.existsSync('./.prettierignore')
			) {
				fs.writeFileSync('./.prettierrc', conf.prettierrc);
				fs.writeFileSync('./.prettierignore', conf.prettierignore);
				skipped = false;
			}
			if (
				tool === 'eslint' &&
				!fs.existsSync('./.eslintrc.cjs') &&
				!fs.existsSync('./.eslintignore')
			) {
				fs.writeFileSync('./.eslintrc.cjs', conf.eslintrc);
				fs.writeFileSync('./.eslintignore', conf.eslintignore);
				skipped = false;
			}
		}
		s.stop(
			skipped
				? 'Skipped generating config files: already exists'
				: 'Generated config files',
		);
	}

	// Install dependencies
	if (config.install) {
		s = p.spinner();
		s.start(`Installing dependencies via ${pkgManager}`);
		try {
			await execa(pkgManager, ['install']);
		} catch (err) {
			console.error(`Failed to install dependencies`);
			process.exit(1);
		}
		s.stop(`Installed dependencies via ${pkgManager}`);
	}

	p.outro(
		`Problems? ${color.underline(color.cyan('https://example.com/issues'))}`,
	);
}

main().catch(console.error);
