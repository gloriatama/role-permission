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
 * Helper to wait for Odoo 17 UI to be fully ready.
 */
async function waitForOdooReady(page) {
    try {
        // Odoo 17 main UI elements
        await page.waitForSelector('.o_navbar, .o_home_menu, .o_main_content', { state: 'visible', timeout: 20000 });
        // Wait for potential loading bar to disappear
        await page.waitForSelector('.o_loading', { state: 'hidden', timeout: 10000 }).catch(() => {});
        // Extra breath for JS execution
        await page.waitForTimeout(1500);
    } catch (e) {
        console.warn('  [WARN] Timeout waiting for Odoo UI readiness indicator.');
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
    
    console.log(`  Navigating to login page...`);
    await page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });

    // Handle Odoo 17 Login Selectors
    const loginSelector = 'input#login';
    const passwordSelector = 'input#password';
    const submitSelector = 'button.btn-primary[type="submit"]';

    console.log(`  Filling credentials...`);
    await page.waitForSelector(loginSelector, { state: 'visible', timeout: 15000 });
    await page.fill(loginSelector, username);
    await page.fill(passwordSelector, password);
    await page.click(submitSelector);

    // Odoo 17 redirect wait (Support both /odoo and /web patterns)
    await page.waitForURL(/(\/odoo|\/web)/, { timeout: 30000 });
    await waitForOdooReady(page);
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
    console.log(`  Visiting ${menuPath}...`);
    try {
        await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await waitForOdooReady(page);
    } catch (e) {
        console.warn(`  [WARN] Navigation to ${menuPath} slow, capturing current state.`);
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
            page, url, '/web',
            `${roleName}-dashboard-${timestamp}.png`
        );
        screenshots.push(dashScreenshot);

        // Step 3: Visit Settings page
        const settingsScreenshot = await visitAndScreenshot(
            page, url, '/web#menu_id=settings', // Attempt common hash path
            `${roleName}-settings-${timestamp}.png`
        );
        screenshots.push(settingsScreenshot);

        // Step 4: Visit Contacts page
        const contactsScreenshot = await visitAndScreenshot(
            page, url, '/web#menu_id=contacts', // Attempt common hash path
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
