import * as fs from "fs";
import { checkA11y, configureAxe,/* getViolations,*/ injectAxe } from "axe-playwright";
import { Page } from "playwright-core";
import { TestHook } from "@storybook/test-runner"

import { A11Y_RULES } from "./a11y-rules";


// https://storybook.js.org/blog/automate-accessibility-tests-with-storybook/
export const setup = () => {
	fs.mkdir(
		process.cwd() + "/__accessibility__/",
		{ recursive: true },
		(err) => {
			if (err) { throw err; }
		}
	);
};

export const preRender: TestHook = async (page: Page, _context) => {
	await injectAxe(page);
};

export const postRender: TestHook = async (page: Page, _context) => {

	await configureAxe(page, {
		rules: A11Y_RULES
	});

	const config = {
		detailedReport: true,
		detailedReportOptions: {
			html: true
		}
	};

	await checkA11y(page, "#root", config);

	// To write violations to JSON files:
	//
	// const path = process.cwd() + `/__accessibility__/${context.id}.json`;

	// if(fs.existsSync(path)){
	//     fs.unlinkSync(path);
	// }

	// const violations = await getViolations(page, '#root', config);

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
};