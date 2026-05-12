const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots');

/**
 * Ensures the screenshots directory exists.
 */
function ensureScreenshotDir() {
    if (!fs.existsSync(SCREENSHOTS_DIR)) {
        fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    }
}

/**
 * Logs into Odoo via the /web/login page.
 * @param {import('playwright').Page} page
 * @param {string} url - Base Odoo URL
 * @param {string} username
 * @param {string} password
 */
async function loginToOdoo(page, url, username, password) {
    const loginUrl = url.replace(/\/+$/, '') + '/web/login';
    
    console.log(`  Navigating to ${loginUrl}...`);
    try {
        await page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    } catch (e) {
        console.warn(`  [WARN] Page load timeout, checking for login form anyway...`);
    }

    // Wait for the login input to be visible
    await page.waitForSelector('input[name="login"]', { state: 'visible', timeout: 15000 });

    await page.fill('input[name="login"]', username);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    // Wait for the dashboard to start loading
    try {
        await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    } catch (e) {
        console.warn(`  [WARN] Post-login navigation wait exceeded.`);
    }
}

/**
 * Navigates to an Odoo menu/page and takes a screenshot.
 * @param {import('playwright').Page} page
 * @param {string} url - Base Odoo URL
 * @param {string} menuPath - Relative path (e.g. '/odoo/settings')
 * @param {string} screenshotName - Filename for the screenshot
 */
async function visitAndScreenshot(page, url, menuPath, screenshotName) {
    const fullUrl = url.replace(/\/+$/, '') + menuPath;
    try {
        await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(2000); // Extra wait for Odoo JS to render
    } catch (e) {
        console.warn(`  [WARN] Timeout navigating to ${menuPath}, taking screenshot anyway...`);
    }
    const filePath = path.join(SCREENSHOTS_DIR, screenshotName);
    await page.screenshot({ path: filePath, fullPage: true });
    console.log(`  Screenshot saved: ${screenshotName}`);
    return screenshotName;
}

/**
 * Runs the full test suite for a single role.
 * @param {import('playwright').Browser} browser
 * @param {object} config
 * @param {string} config.url - Odoo base URL
 * @param {string} config.username
 * @param {string} config.password
 * @param {string} config.roleName - e.g. 'admin' or 'sales'
 * @returns {Promise<object>} Result object with role name, status, error, and screenshot list
 */
async function testRole(browser, config) {
    const { url, username, password, roleName } = config;
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();
    const screenshots = [];
    const timestamp = Date.now();
    let status = 'success';
    let errorMessage = null;

    console.log(`\n[${roleName.toUpperCase()}] Starting test...`);

    try {
        // Step 1: Login
        console.log(`  Logging in as ${username}...`);
        await loginToOdoo(page, url, username, password);

        // Step 2: Screenshot the dashboard (landing page after login)
        const dashScreenshot = await visitAndScreenshot(
            page, url, '/odoo',
            `${roleName}-dashboard-${timestamp}.png`
        );
        screenshots.push(dashScreenshot);

        // Step 3: Visit Settings page (typically admin-accessible)
        const settingsScreenshot = await visitAndScreenshot(
            page, url, '/odoo/settings',
            `${roleName}-settings-${timestamp}.png`
        );
        screenshots.push(settingsScreenshot);

        // Step 4: Visit Contacts page (commonly accessible)
        const contactsScreenshot = await visitAndScreenshot(
            page, url, '/odoo/contacts',
            `${roleName}-contacts-${timestamp}.png`
        );
        screenshots.push(contactsScreenshot);

        console.log(`[${roleName.toUpperCase()}] Test completed successfully.`);
    } catch (error) {
        status = 'failed';
        errorMessage = error.message;
        console.error(`[${roleName.toUpperCase()}] Error: ${error.message}`);
        // Take error screenshot
        try {
            const errScreenshot = `${roleName}-error-${timestamp}.png`;
            await page.screenshot({ path: path.join(SCREENSHOTS_DIR, errScreenshot) });
            screenshots.push(errScreenshot);
        } catch (_) { /* ignore screenshot errors */ }
    } finally {
        await context.close();
    }

    return { role: roleName, status, error: errorMessage, screenshots };
}

/**
 * Main entry point: runs tests for all configured roles.
 * @param {object} config - Form data from the frontend
 * @param {string} config.odooUrl
 * @param {string} config.adminUsername
 * @param {string} config.adminPassword
 * @param {string} config.salesUsername
 * @param {string} config.salesPassword
 * @returns {Promise<object>} Results summary
 */
async function runTests(config) {
    ensureScreenshotDir();

    const { odooUrl, adminUsername, adminPassword, salesUsername, salesPassword } = config;

    console.log('\n========================================');
    console.log('  Odoo Test Runner - Starting');
    console.log(`  Target: ${odooUrl}`);
    console.log('========================================');

    const browser = await chromium.launch({ headless: false });
    const results = [];

    try {
        // Test Admin role
        const adminResult = await testRole(browser, {
            url: odooUrl,
            username: adminUsername,
            password: adminPassword,
            roleName: 'admin',
        });
        results.push(adminResult);

        // Test Sales role
        const salesResult = await testRole(browser, {
            url: odooUrl,
            username: salesUsername,
            password: salesPassword,
            roleName: 'sales',
        });
        results.push(salesResult);
    } finally {
        await browser.close();
    }

    console.log('\n========================================');
    console.log('  All tests completed!');
    console.log('========================================\n');

    return { success: true, results };
}

module.exports = { runTests };
