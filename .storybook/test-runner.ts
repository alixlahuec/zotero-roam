import * as fs from "fs";
import { checkA11y, configureAxe,/* getViolations,*/ injectAxe } from "axe-playwright";
import { AxeOptions } from "axe-playwright/dist/types";
import { TestRunnerConfig } from "@storybook/test-runner";
import { A11Y_RULES } from "./a11y-rules";


const a11yConfig: TestRunnerConfig = {
	// https://storybook.js.org/blog/automate-accessibility-tests-with-storybook/
	setup() {
		fs.mkdir(
			process.cwd() + "/__accessibility__/",
			{ recursive: true },
			(err) => {
				if (err) { throw err; }
			}
		);
	},
	async preVisit(page, _context) {
		await injectAxe(page);
	},
	async postVisit(page, _context) {
		await configureAxe(page, {
			rules: A11Y_RULES
		});

		const config: AxeOptions = {
			detailedReport: true,
			detailedReportOptions: {
				html: true
			}
		};

		await checkA11y(page, "#storybook-root", config);

		// To write violations to JSON files:
		//
		// const path = process.cwd() + `/__accessibility__/${context.id}.json`;

		// if(fs.existsSync(path)){
		//     fs.unlinkSync(path);
		// }

		// const violations = await getViolations(page, '#storybook-root', config);

		// if(violations.length > 0) {
		//     await new Promise((resolve, reject) => {
		//         fs.writeFile(
		//             path, 
		//             JSON.stringify(violations, null, 2),
		//             (err) => {
		//                 if (err) reject(err);
		//                 resolve();
		//             }
		//         );
		//     });
		// }
	}
};

module.exports = a11yConfig;