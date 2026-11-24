import fs from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

async function assertNoHorizontalOverflow(page: Page) {
  const dims = await page.evaluate(() => {
    const main = document.querySelector('main');
    const header = document.querySelector('header');
    const mainRect = main?.getBoundingClientRect();
    const headerRect = header?.getBoundingClientRect();
    return {
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      mainWidth: mainRect ? Math.ceil(mainRect.width) : 0,
      headerWidth: headerRect ? Math.ceil(headerRect.width) : 0,
    };
  });
  expect(dims.scrollWidth).toBeLessThanOrEqual(dims.innerWidth);
  expect(dims.mainWidth).toBeLessThanOrEqual(dims.innerWidth);
  expect(dims.headerWidth).toBeLessThanOrEqual(dims.innerWidth);
}

function buildCompliantBuyerCsv(): string {
  return [
    'request_id,buyer_or_lender_name,buyer_csrd_covered,requested_tier,sme_employees,reporting_period_start,includes_excess_esrs_fields',
    'REQ-201,EuroGreen Commercial Bank,true,vsme_comprehensive,320,2027-01-01,false',
  ].join('\n');
}

test.describe('VSMEKit — (EU) 2026/1560 & 2027 Value-Chain Cap Studio E2E', () => {
  test('defaults to EN LTR Limestone Parchment, toggles AR RTL Carbon Slate, and persists across reload', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    await expect(page.locator('header')).toContainText('SQLite WAL');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'esg-parchment');
    await expect(
      page.getByRole('img', {
        name: 'CSRD threshold, 2027 Value-Chain Shield, and VSME B1-B11 / C1-C9 matrix chart',
      }),
    ).toBeVisible();
    await expect(page.locator('main')).toContainText('100/100');
    await expect(page.locator('main')).toContainText('NOT affiliated');
    await assertNoHorizontalOverflow(page);

    await page.screenshot({
      path: 'test-results/qa-screenshots/01-workspace-en-limestone-parchment.png',
      fullPage: true,
      animations: 'disabled',
    });

    await page.getByTestId('lang-toggle').click();
    await page.getByTestId('theme-toggle').click();

    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'carbon-slate');
    await expect(page.locator('main')).toContainText('ليست تابعة');
    await assertNoHorizontalOverflow(page);

    await page.screenshot({
      path: 'test-results/qa-screenshots/02-workspace-ar-carbon-slate.png',
      fullPage: true,
      animations: 'disabled',
    });

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'carbon-slate');

    expect(errors).toEqual([]);
  });

  test('evaluates Pre-2027 conditional & remediates Buyer Over-Reach into sealed VSME-YYYY-0001 with BOM CSV & /r/:code', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    const year = new Date().getUTCFullYear();
    const expectedCode = `VSME-${year}-0001`;

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await expect(page.locator('main')).toContainText('100/100');

    // Preset 2: Pre-2027 Micro Supplier (Conditional)
    await page.getByTestId('preset-pre-2027-micro-basic-prep').click();
    await expect(page.getByTestId('status-badge')).toContainText('CONDITIONAL');
    await assertNoHorizontalOverflow(page);

    await page.screenshot({
      path: 'test-results/qa-screenshots/03-pre-2027-conditional-desktop.png',
      fullPage: true,
      animations: 'disabled',
    });

    // Preset 3: Supply-Chain Dispute & Disclosure Gaps (Blocked — 120h cap shield & B/C gaps)
    await page.getByTestId('preset-buyer-overreach-and-disclosure-gaps-blocked').click();
    await expect(page.getByTestId('status-badge')).toContainText('BLOCKED');
    await expect(page.locator('main')).toContainText('120h');

    // Remediate Buyer Request -> Comprehensive, clean B11/Scope3/Disclosures/Controls/CSV
    await page.locator('select').nth(2).selectOption('vsme_comprehensive');

    await page.getByTestId('tab-disclosures').click();
    await page.getByRole('button', { name: 'Select All B1–B11' }).click();
    await page.getByRole('button', { name: 'Select All C1–C9' }).click();

    await page.getByLabel('Scope 3 Value-Chain GHG (tCO2e)').fill('840');
    await page.getByLabel('B11 Corruption/Bribery Convictions Count').fill('0');

    for (const ctrlId of [
      'VSME-CTRL-02',
      'VSME-CTRL-03',
      'VSME-CTRL-04',
      'VSME-CTRL-05',
      'VSME-CTRL-06',
    ]) {
      await page.getByRole('button', { name: new RegExp(ctrlId) }).click();
    }

    await page.getByTestId('tab-csv').click();
    await page.locator('textarea[dir="ltr"]').fill(buildCompliantBuyerCsv());

    await expect(page.getByTestId('status-badge')).toContainText('READY');
    await expect(page.locator('main')).toContainText('100/100');

    // Switch to Vault tab: save draft -> seal -> BOM CSV -> screenshot
    await page.getByTestId('tab-vault').click();
    await page.getByTestId('btn-create-dossier').click();
    await expect(page.locator('main')).toContainText(expectedCode);

    await page.getByTestId('btn-seal-dossier').click();
    await expect(page.getByTestId('btn-seal-dossier')).toHaveCount(0);
    await expect(page.getByTestId('btn-open-public')).toBeVisible();

    const dlPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export Safe CSV (BOM)' }).first().click();
    const dl = await dlPromise;
    expect(dl.suggestedFilename()).toContain('.csv');
    const dlPath = await dl.path();
    expect(dlPath).toBeTruthy();
    if (dlPath) {
      const bytes = fs.readFileSync(dlPath);
      expect(Array.from(bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]);
    }

    await page.screenshot({
      path: 'test-results/qa-screenshots/04-sealed-dossier-desktop.png',
      fullPage: true,
      animations: 'disabled',
    });

    // Public share route /r/:code & reload persistence
    await page.getByTestId('btn-open-public').click();
    await expect(page.locator('body')).toContainText(expectedCode);
    await expect(page.locator('body')).toContainText('IberiaPack Components S.L.');
    await expect(page.locator('body')).toContainText('Public Report Views: 1');
    await page.reload();
    await expect(page.locator('body')).toContainText(expectedCode);
    await expect(page.locator('body')).toContainText('Public Report Views: 2');

    expect(errors).toEqual([]);
  });

  test('verifies mobile 390x844 responsiveness in EN Limestone Parchment and AR Carbon Slate with zero overflow', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(
      page.getByRole('img', {
        name: 'CSRD threshold, 2027 Value-Chain Shield, and VSME B1-B11 / C1-C9 matrix chart',
      }),
    ).toBeVisible();
    await assertNoHorizontalOverflow(page);

    await page.screenshot({
      path: 'test-results/qa-screenshots/05-mobile-en-limestone-parchment.png',
      fullPage: true,
      animations: 'disabled',
    });

    await page.getByTestId('lang-toggle').click();
    await page.getByTestId('theme-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'carbon-slate');
    await assertNoHorizontalOverflow(page);

    await page.screenshot({
      path: 'test-results/qa-screenshots/06-mobile-ar-carbon-slate.png',
      fullPage: true,
      animations: 'disabled',
    });

    expect(errors).toEqual([]);
  });
});
