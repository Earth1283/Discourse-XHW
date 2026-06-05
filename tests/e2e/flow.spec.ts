import { test, expect } from "@playwright/test";

// Assumes the app is running at BASE_URL (default http://localhost:3000)
// and has been seeded with at least one board (e.g. /b/gen).

const BOARD = "gen";

async function acceptRulesGate(page: any) {
  const gate = page.locator('[data-testid="rules-gate"]');
  try {
    await expect(gate).toBeVisible({ timeout: 2000 });
    await page.getByTestId("rules-checkbox").check();
    await page.getByTestId("rules-accept-btn").click();
    await expect(gate).not.toBeVisible();
  } catch (e) {
    // Gate not shown or already accepted
  }
}

test.describe("XHW Life smoke flow", () => {
  test("rules gate: shown on first visit, dismissed on accept, gone after reload", async ({
    page,
    context,
  }) => {
    // Clear cookies so gate shows
    await context.clearCookies();
    await page.goto("/");

    const gate = page.locator('[data-testid="rules-gate"]');
    await expect(gate).toBeVisible({ timeout: 5_000 });

    await page.getByTestId("rules-checkbox").check();
    await page.getByTestId("rules-accept-btn").click();
    await expect(gate).not.toBeVisible();

    // Reload — gate must stay dismissed
    await page.reload();
    await expect(gate).not.toBeVisible();
  });

  test("create thread → thread page with OP visible", async ({ page, context }) => {
    await context.clearCookies();
    await page.goto(`/b/${BOARD}`);

    // Accept rules gate if shown
    await acceptRulesGate(page);

    const uniqueBody = `e2e-test-${Date.now()}`;

    // Open thread composer and post
    await page.getByTestId("new-thread-btn").click();
    await page.getByTestId("thread-body-input").fill(uniqueBody);
    await page.getByTestId("thread-post-btn").click();

    // Should redirect to thread page
    await page.waitForURL(/\/b\/.+\/.+/);

    // OP body should appear
    await expect(page.locator("body")).toContainText(uniqueBody);
  });

  test("post reply → appears optimistically, persists after reload", async ({
    page,
    context,
  }) => {
    await context.clearCookies();
    await page.goto(`/b/${BOARD}`);

    await acceptRulesGate(page);

    // Create a thread first
    const threadBody = `reply-test-${Date.now()}`;
    await page.getByTestId("new-thread-btn").click();
    await page.getByTestId("thread-body-input").fill(threadBody);
    await page.getByTestId("thread-post-btn").click();
    await page.waitForURL(/\/b\/.+\/.+/);

    // Post a reply
    const replyBody = `reply-${Date.now()}`;
    await page.getByTestId("reply-body-input").fill(replyBody);
    await page.getByTestId("reply-post-btn").click();

    // Optimistic: appears quickly
    await expect(page.locator("body")).toContainText(replyBody, { timeout: 3_000 });

    // Persists after reload
    await page.reload();
    await expect(page.locator("body")).toContainText(replyBody);
  });

  test("self-delete own reply within window → shows [deleted]", async ({
    page,
    context,
  }) => {
    await context.clearCookies();
    await page.goto(`/b/${BOARD}`);

    await acceptRulesGate(page);

    // Create thread
    await page.getByTestId("new-thread-btn").click();
    await page.getByTestId("thread-body-input").fill(`del-test-${Date.now()}`);
    await page.getByTestId("thread-post-btn").click();
    await page.waitForURL(/\/b\/.+\/.+/);

    // Post reply
    const replyText = `to-delete-${Date.now()}`;
    await page.getByTestId("reply-body-input").fill(replyText);
    await page.getByTestId("reply-post-btn").click();
    await expect(page.locator("body")).toContainText(replyText, { timeout: 3_000 });

    // Click delete on the reply (only appears for own posts)
    const deleteBtn = page.getByTestId("delete-btn").last();
    page.once("dialog", (dialog) => dialog.accept());
    await deleteBtn.click();

    // Should show [deleted]
    await expect(page.locator("body")).toContainText("[deleted]", { timeout: 5_000 });
  });

  test("admin login → delete a post", async ({ page, context }) => {
    // Skip if env vars not set
    const adminHandle = process.env.ADMIN_HANDLE;
    const adminPass = process.env.ADMIN_PASSWORD;
    if (!adminHandle || !adminPass) {
      test.skip();
      return;
    }

    await context.clearCookies();

    // Login as admin
    await page.goto("/admin/login");
    await page.getByPlaceholder("handle").fill(adminHandle);
    await page.getByPlaceholder("password").fill(adminPass);
    await page.getByRole("button", { name: /login/i }).click();
    await page.waitForURL("/admin");

    // Navigate to a board and create a thread to delete
    await page.goto(`/b/${BOARD}`);
    await acceptRulesGate(page);

    const targetBody = `admin-delete-test-${Date.now()}`;
    await page.getByTestId("new-thread-btn").click();
    await page.getByTestId("thread-body-input").fill(targetBody);
    await page.getByTestId("thread-post-btn").click();
    await page.waitForURL(/\/b\/.+\/.+/);

    // Admin delete button should be visible
    const adminDelBtn = page.getByTestId("delete-btn").first();
    page.once("dialog", (dialog) => dialog.accept());
    await adminDelBtn.click();
    await expect(page.locator("body")).toContainText("[deleted]", { timeout: 5_000 });
  });
});
