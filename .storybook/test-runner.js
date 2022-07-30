const { checkA11y, configureAxe,/* getViolations,*/ injectAxe } = require('axe-playwright');
const fs = require('fs');

const { A11Y_RULES } = require("./a11y-rules");

// https://storybook.js.org/blog/automate-accessibility-tests-with-storybook/
module.exports = {
    setup() {
        fs.mkdir(
            process.cwd() + '/__accessibility__/',
            { recursive: true },
            (err) => {
                if (err) throw err;
            }
        );
    },
    async preRender(page, _context) {
        await injectAxe(page);
    },
    async postRender(page, _context) {

        await configureAxe(page, {
            rules: A11Y_RULES
          })

        const config = {
            detailedReport: true,
            detailedReportOptions: {
                html: true
            }
        };

        await checkA11y(page, '#root', config);

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
    },
};