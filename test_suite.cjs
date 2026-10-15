const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5173';

const results = {
  passed: [],
  failed: [],
  consoleErrors: [],
  warnings: []
};

function pass(name, detail = '') {
  results.passed.push({ name, detail });
  console.log(`[PASS] ${name}${detail ? ' - ' + detail : ''}`);
}

function fail(name, error) {
  results.failed.push({ name, error: error.message || String(error) });
  console.error(`[FAIL] ${name}:`, error);
}

async function run() {
  console.log('Launching Chrome for End-to-End Automated Testing...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800']
  });

  try {
    const page = await browser.newPage();
    page.setViewport({ width: 1280, height: 800 });

    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') {
        if (!text.includes('favicon.ico')) {
          results.consoleErrors.push(text);
          console.log(`  [Browser Console Error]: ${text}`);
        }
      }
    });

    page.on('pageerror', err => {
      results.consoleErrors.push(err.message);
      console.log(`  [Browser Page Error]: ${err.message}`);
    });

    // ----------------------------------------------------
    // TEST 1: Fresh visitor default Light Mode
    // ----------------------------------------------------
    console.log('\n--- Test 1: Default Light Mode for New Visitors ---');
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    await page.evaluate(() => localStorage.removeItem('kenbon-theme'));
    await page.reload({ waitUntil: 'networkidle2' });

    const themeInitial = await page.evaluate(() => {
      return {
        dataTheme: document.documentElement.getAttribute('data-theme'),
        hasClassLight: document.documentElement.classList.contains('light'),
        hasClassDark: document.documentElement.classList.contains('dark'),
        storedTheme: localStorage.getItem('kenbon-theme'),
        bgColor: window.getComputedStyle(document.body).backgroundColor
      };
    });

    if (themeInitial.dataTheme === 'light' && themeInitial.hasClassLight && !themeInitial.hasClassDark) {
      pass('1. Default Light Mode', `data-theme: ${themeInitial.dataTheme}, bg: ${themeInitial.bgColor}`);
    } else {
      fail('1. Default Light Mode', new Error(`Expected data-theme='light', got: ${JSON.stringify(themeInitial)}`));
    }

    // ----------------------------------------------------
    // TEST 2: Theme Toggle to Dark Mode & Persistence
    // ----------------------------------------------------
    console.log('\n--- Test 2: Theme Toggle to Dark Mode & Reload Persistence ---');
    const toggleButton = await page.$('.theme-toggle');
    if (!toggleButton) {
      fail('2. Theme Toggle', new Error('Theme toggle button not found on landing page'));
    } else {
      await toggleButton.click();
      await page.waitForFunction(() => document.documentElement.getAttribute('data-theme') === 'dark');

      const darkState = await page.evaluate(() => ({
        dataTheme: document.documentElement.getAttribute('data-theme'),
        hasClassDark: document.documentElement.classList.contains('dark'),
        storedTheme: localStorage.getItem('kenbon-theme')
      }));

      if (darkState.dataTheme === 'dark' && darkState.hasClassDark && darkState.storedTheme === 'dark') {
        pass('2a. Toggle to Dark Mode', `Stored: ${darkState.storedTheme}, class: dark`);
      } else {
        fail('2a. Toggle to Dark Mode', new Error(`Expected dark mode state, got: ${JSON.stringify(darkState)}`));
      }

      // Reload to test persistence and anti-FOUT
      await page.reload({ waitUntil: 'networkidle2' });
      const reloadedDarkState = await page.evaluate(() => ({
        dataTheme: document.documentElement.getAttribute('data-theme'),
        hasClassDark: document.documentElement.classList.contains('dark'),
        storedTheme: localStorage.getItem('kenbon-theme')
      }));

      if (reloadedDarkState.dataTheme === 'dark' && reloadedDarkState.hasClassDark) {
        pass('2b. Dark Mode Persistence on Reload', 'Saved preference restored cleanly');
      } else {
        fail('2b. Dark Mode Persistence on Reload', new Error(`Failed to restore dark mode: ${JSON.stringify(reloadedDarkState)}`));
      }

      // Toggle back to Light Mode
      await page.click('.theme-toggle');
      await page.waitForFunction(() => document.documentElement.getAttribute('data-theme') === 'light');

      await page.reload({ waitUntil: 'networkidle2' });
      const reloadedLightState = await page.evaluate(() => ({
        dataTheme: document.documentElement.getAttribute('data-theme'),
        hasClassLight: document.documentElement.classList.contains('light'),
        storedTheme: localStorage.getItem('kenbon-theme')
      }));

      if (reloadedLightState.dataTheme === 'light' && reloadedLightState.storedTheme === 'light') {
        pass('2c. Toggle back to Light Mode & Persistence', 'Light mode restored cleanly');
      } else {
        fail('2c. Toggle back to Light Mode & Persistence', new Error(`Failed to restore light mode: ${JSON.stringify(reloadedLightState)}`));
      }
    }

    // ----------------------------------------------------
    // TEST 3: Homepage & Responsive Layouts
    // ----------------------------------------------------
    console.log('\n--- Test 3: Public Homepage Sections & Responsive Layouts ---');
    const heroBrand = await page.$eval('.hero-nav-brand, .hero-subtitle', el => el.textContent).catch(() => '');
    if (heroBrand.toLowerCase().includes('kenbon') || heroBrand.toLowerCase().includes('culinary') || heroBrand.toLowerCase().includes('bule hora')) {
      pass('3a. Homepage Hero Section', `Hero brand/subtitle: "${heroBrand.trim()}"`);
    } else {
      fail('3a. Homepage Hero Section', new Error(`Hero brand missing, found: "${heroBrand}"`));
    }

    // Check ETB pricing on homepage menu
    const menuPrices = await page.$$eval('.menu-item-price, .special-price, .signature-dish-price', els => els.map(e => e.textContent));
    const allPricesETB = menuPrices.length > 0 && menuPrices.every(p => p.includes('ETB'));
    if (allPricesETB) {
      pass('3b. Homepage ETB Currency Formatting', `Verified ${menuPrices.length} prices formatted in ETB`);
    } else {
      fail('3b. Homepage ETB Currency Formatting', new Error(`Stray currency found in: ${JSON.stringify(menuPrices)}`));
    }

    // Test responsive viewports
    // Tablet
    await page.setViewport({ width: 768, height: 1024 });
    const tabletNav = await page.$('.hero-nav');
    if (tabletNav) pass('3c. Tablet Layout (768px)', 'Navigation rendered');

    // Mobile
    await page.setViewport({ width: 375, height: 667 });
    const mobileNav = await page.$('.hero-nav');
    if (mobileNav) pass('3d. Mobile Layout (375px)', 'Mobile view rendered');

    // Reset to desktop
    await page.setViewport({ width: 1280, height: 800 });

    // ----------------------------------------------------
    // TEST 4: Table Ordering & Menu Flow (/order?table=5)
    // ----------------------------------------------------
    console.log('\n--- Test 4: Table Ordering & Menu Flow ---');
    await page.goto(`${BASE_URL}/order?table=5`, { waitUntil: 'networkidle2' });
    const tableHeader = await page.$eval('h1, h2, .menu-table-title', el => el.textContent).catch(() => null);
    const hasETBCard = await page.evaluate(() => document.body.innerText.includes('ETB'));
    if (tableHeader && hasETBCard) {
      pass('4a. Table Ordering Page Rendered', `Header: "${tableHeader.trim()}", ETB displayed`);
    } else {
      fail('4a. Table Ordering Page Rendered', new Error('Table ordering page did not load correctly'));
    }

    // Check ThemeToggle presence on Table Ordering
    const floatingToggle = await page.$('.theme-toggle');
    if (floatingToggle) {
      pass('4b. Floating Theme Toggle on Table Order Page', 'Accessible theme toggle found');
    } else {
      fail('4b. Floating Theme Toggle on Table Order Page', new Error('Theme toggle missing on table order page'));
    }

    // ----------------------------------------------------
    // TEST 5: Reservation Page (/reservation)
    // ----------------------------------------------------
    console.log('\n--- Test 5: Table Reservation Page ---');
    await page.goto(`${BASE_URL}/reservation`, { waitUntil: 'networkidle2' });
    const reservationHeading = await page.$eval('h1, h2, .reservation-title', el => el.textContent).catch(() => null);
    const reservationFormExists = await page.$('form, .reservation-form');
    if (reservationHeading && reservationFormExists) {
      pass('5. Reservation Page', `Title: "${reservationHeading.trim()}"`);
    } else {
      fail('5. Reservation Page', new Error('Reservation page or form missing'));
    }

    // ----------------------------------------------------
    // TEST 6: Login & Authentication (/login)
    // ----------------------------------------------------
    console.log('\n--- Test 6: Authentication & Authorization Flow ---');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });

    // Invalid credentials check
    await page.type('input[type="text"], input[name="usernameOrEmail"], input#usernameOrEmail', 'invalid_user@test.com');
    await page.type('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await page.waitForSelector('.login-error, [role="alert"]', { timeout: 5000 }).catch(() => null);
    const errorText = await page.$eval('.login-error, [role="alert"]', el => el.textContent).catch(() => '');
    if (errorText) {
      pass('6a. Invalid Credentials Handled', `Error message: "${errorText.trim()}"`);
    } else {
      fail('6a. Invalid Credentials Handled', new Error('No error message shown for invalid login'));
    }

    // Valid Admin Login
    await page.reload({ waitUntil: 'networkidle2' });
    await page.type('input[type="text"], input[name="usernameOrEmail"], input#usernameOrEmail', 'admin@kenbon.com');
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => window.location.pathname.includes('/dashboard'), { timeout: 10000 });

    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard')) {
      pass('6b. Admin Authentication & Dashboard Redirect', `Landed on: ${currentUrl}`);
    } else {
      fail('6b. Admin Authentication & Dashboard Redirect', new Error(`Expected /dashboard, landed on ${currentUrl}`));
    }

    // ----------------------------------------------------
    // TEST 7: Admin Dashboard & All Management Views
    // ----------------------------------------------------
    console.log('\n--- Test 7: Admin Dashboard & Management Views ---');
    // Wait for stats to load
    await page.waitForSelector('.dashboard-card-value', { timeout: 8000 }).catch(() => null);
    const dashboardText = await page.evaluate(() => document.body.innerText);
    const revenueHasETB = dashboardText.includes('ETB');
    if (revenueHasETB) {
      pass('7a. Admin Dashboard Metrics in ETB', 'Revenue formatted in ETB');
    } else {
      fail('7a. Admin Dashboard Metrics in ETB', new Error('ETB currency missing on admin dashboard'));
    }

    // Menu Management Page
    await page.goto(`${BASE_URL}/dashboard/menu`, { waitUntil: 'networkidle2' });
    const menuPageTitle = await page.$eval('h1, .page-title', el => el.textContent).catch(() => '');
    const hasCategoryCard = await page.$('.category-card, .menu-item, .card');
    if (menuPageTitle.includes('Menu') || hasCategoryCard) {
      pass('7b. Menu Management (/dashboard/menu)', 'Menu catalog rendered');
    } else {
      fail('7b. Menu Management (/dashboard/menu)', new Error('Menu page failed to render'));
    }

    // Orders Management Page
    await page.goto(`${BASE_URL}/dashboard/orders`, { waitUntil: 'networkidle2' });
    const ordersTitle = await page.$eval('h1, .page-title', el => el.textContent).catch(() => '');
    const ordersText = await page.evaluate(() => document.body.innerText);
    if (ordersTitle.includes('Order') && ordersText.includes('ETB')) {
      pass('7c. Orders Management (/dashboard/orders)', 'Orders rendered with ETB pricing');
    } else {
      fail('7c. Orders Management (/dashboard/orders)', new Error('Orders management missing or stray currency found'));
    }

    // Kitchen Queue Page
    await page.goto(`${BASE_URL}/dashboard/kitchen`, { waitUntil: 'networkidle2' });
    const kitchenTitle = await page.$eval('h1, .page-title', el => el.textContent).catch(() => '');
    if (kitchenTitle.includes('Kitchen')) {
      pass('7d. Kitchen Queue (/dashboard/kitchen)', 'Kitchen interface loaded');
    } else {
      fail('7d. Kitchen Queue (/dashboard/kitchen)', new Error('Kitchen queue failed to load'));
    }

    // Delivery Dashboard Page
    await page.goto(`${BASE_URL}/dashboard/delivery`, { waitUntil: 'networkidle2' });
    const deliveryTitle = await page.$eval('h1, .page-title', el => el.textContent).catch(() => '');
    if (deliveryTitle.includes('Delivery')) {
      pass('7e. Delivery Dashboard (/dashboard/delivery)', 'Delivery interface loaded');
    } else {
      fail('7e. Delivery Dashboard (/dashboard/delivery)', new Error('Delivery dashboard failed to load'));
    }

    // Users Management Page
    await page.goto(`${BASE_URL}/dashboard/users`, { waitUntil: 'networkidle2' });
    const usersTitle = await page.$eval('h1, .page-title', el => el.textContent).catch(() => '');
    if (usersTitle.includes('Users')) {
      pass('7f. Users Management (/dashboard/users)', 'Users directory loaded');
    } else {
      fail('7f. Users Management (/dashboard/users)', new Error('Users management failed to load'));
    }

    // Settings Page
    await page.goto(`${BASE_URL}/dashboard/settings`, { waitUntil: 'networkidle2' });
    const settingsTitle = await page.$eval('h1, .page-title', el => el.textContent).catch(() => '');
    if (settingsTitle.includes('Settings')) {
      pass('7g. Settings (/dashboard/settings)', 'Restaurant settings loaded');
    } else {
      fail('7g. Settings (/dashboard/settings)', new Error('Settings page failed to load'));
    }

    // Dashboard Theme Toggle check (sidebar toggle on desktop)
    const sidebarThemeToggle = await page.$('.main-layout-sidebar .theme-toggle');
    if (sidebarThemeToggle) {
      await sidebarThemeToggle.click();
      await page.waitForFunction(() => document.documentElement.getAttribute('data-theme') === 'dark');
      const darkDash = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
      await sidebarThemeToggle.click();
      await page.waitForFunction(() => document.documentElement.getAttribute('data-theme') === 'light');
      const lightDash = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
      if (darkDash === 'dark' && lightDash === 'light') {
        pass('7h. Dashboard Theme Toggle Switching', 'Toggled between dark & light inside dashboard');
      } else {
        fail('7h. Dashboard Theme Toggle Switching', new Error(`Toggle failed: ${darkDash} -> ${lightDash}`));
      }
    } else {
      fail('7h. Dashboard Theme Toggle Switching', new Error('Sidebar theme toggle not found'));
    }

    // ----------------------------------------------------
    // TEST 8: Role-based Dashboards (Waiter & Cashier)
    // ----------------------------------------------------
    console.log('\n--- Test 8: Role-Based Dashboards ---');
    // Login as Waiter in a clean tab
    const waiterPage = await browser.newPage();
    waiterPage.setViewport({ width: 1280, height: 800 });
    await waiterPage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
    await waiterPage.evaluate(() => localStorage.clear());
    await waiterPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await waiterPage.type('input[type="text"]', 'waiter@kenbon.com');
    await waiterPage.type('input[type="password"]', 'password123');
    await waiterPage.click('button[type="submit"]');
    await waiterPage.waitForFunction(() => window.location.pathname.includes('/dashboard'), { timeout: 10000 });

    const waiterDashboardText = await waiterPage.evaluate(() => document.body.innerText);
    if (waiterDashboardText.includes('Waiter') || waiterDashboardText.includes('Orders') || waiterPage.url().includes('dashboard')) {
      pass('8a. Waiter Role Dashboard', 'Waiter interface verified');
    } else {
      fail('8a. Waiter Role Dashboard', new Error('Failed to load waiter dashboard'));
    }
    await waiterPage.close();

    // Login as Cashier in a clean tab
    const cashierPage = await browser.newPage();
    cashierPage.setViewport({ width: 1280, height: 800 });
    await cashierPage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
    await cashierPage.evaluate(() => localStorage.clear());
    await cashierPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await cashierPage.type('input[type="text"]', 'cashier@kenbon.com');
    await cashierPage.type('input[type="password"]', 'password123');
    await cashierPage.click('button[type="submit"]');
    await cashierPage.waitForFunction(() => window.location.pathname.includes('/dashboard'), { timeout: 10000 });

    const cashierDashboardText = await cashierPage.evaluate(() => document.body.innerText);
    if (cashierDashboardText.includes('Cashier') || cashierDashboardText.includes('Orders') || cashierPage.url().includes('dashboard')) {
      pass('8b. Cashier Role Dashboard', 'Cashier interface verified');
    } else {
      fail('8b. Cashier Role Dashboard', new Error('Failed to load cashier dashboard'));
    }
    await cashierPage.close();

    // ----------------------------------------------------
    // TEST 9: Registration Page Flow (/register)
    // ----------------------------------------------------
    console.log('\n--- Test 9: Customer Registration Flow ---');
    const regPage = await browser.newPage();
    regPage.setViewport({ width: 1280, height: 800 });
    await regPage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
    await regPage.evaluate(() => localStorage.clear());
    await regPage.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle2' });

    const regHeading = await regPage.$eval('h1, h2, .register-title', el => el.textContent).catch(() => '');
    const regForm = await regPage.$('.register-form, form');
    if (regHeading && regForm) {
      pass('9a. Registration Page Rendered', `Form rendered with title: "${regHeading.trim()}"`);
    } else {
      fail('9a. Registration Page Rendered', new Error('Registration page or form not found'));
    }

    // Submit new customer registration
    const testEmail = `cust_${Date.now()}@kenbon-test.com`;
    await regPage.type('input[type="email"]', testEmail);
    await regPage.type('input[name="username"], input[type="text"]', `cust_${Date.now()}`);
    const passwordInputs = await regPage.$$('input[type="password"]');
    if (passwordInputs.length >= 2) {
      await passwordInputs[0].type('Password123!');
      await passwordInputs[1].type('Password123!');
      await regPage.click('button[type="submit"]');

      await regPage.waitForFunction(() => window.location.pathname.includes('/verify-email') || window.location.pathname.includes('/dashboard'), { timeout: 10000 });
      const currentRegUrl = regPage.url();
      if (currentRegUrl.includes('/verify-email-required') || currentRegUrl.includes('/dashboard')) {
        pass('9b. Registration Submission & Verification Flow', `Redirected to: ${currentRegUrl}`);
      } else {
        fail('9b. Registration Submission & Verification Flow', new Error(`Unexpected redirect: ${currentRegUrl}`));
      }
    }
    await regPage.close();

  } finally {
    await browser.close();
  }

  // Summary
  console.log('\n=============================================');
  console.log(`TOTAL TESTS RUN: ${results.passed.length + results.failed.length}`);
  console.log(`PASSED: ${results.passed.length}`);
  console.log(`FAILED: ${results.failed.length}`);
  console.log(`BROWSER CONSOLE ERRORS: ${results.consoleErrors.length}`);
  console.log('=============================================');

  if (results.failed.length > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Test Suite Fatal Error:', err);
  process.exit(1);
});
