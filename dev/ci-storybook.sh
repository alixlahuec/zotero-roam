# Storybook test runner (https://storybook.js.org/docs/react/writing-tests/test-runner#set-up-ci-to-run-tests)

# Install Playwright
sudo apt-get update
npx playwright install --with-deps

# Build Storybook
npm run build-storybook

# Serve Storybook and run tests
npm install concurrently http-server wait-on --no-save
npx concurrently -k -s first -n "SB,TEST" -c "magenta,blue" \
    "npx http-server storybook-static --port 6006 --silent" \
    "npx wait-on tcp:6006 && npm run ci:test-storybook"