import { expect, test } from "@playwright/test";

test("browse → add to bag → COD checkout → order visible in admin", async ({ page }) => {
  // Home: the wardrobe hero renders its hangers
  await page.goto("/");
  await expect(page.locator("[data-hanger]").first()).toBeAttached();

  // Shop → product
  await page.goto("/collections/luxury-pret");
  await page.getByRole("link", { name: "Sitara" }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Sitara" })).toBeVisible();

  // Add size M to the bag
  await page.getByRole("radio", { name: /^M/ }).click();
  await page.getByRole("button", { name: "Add to Bag", exact: true }).click();
  await expect(page.getByRole("dialog").getByText("Sitara")).toBeVisible();
  await page.getByRole("link", { name: "Proceed to checkout" }).click();

  // Checkout (Cash on Delivery)
  await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();
  await page.fill("#co-customer_name", "E2E Tester");
  await page.fill("#co-phone", "0345 1112233");
  await page.fill("#co-city", "Karachi");
  await page.keyboard.press("Enter");
  await page.fill("#co-area", "Clifton Block 4");
  await page.fill("#co-address", "Flat 12, Ocean Towers, Clifton");
  await expect(page.getByText("Rs. 18,500").first()).toBeVisible();
  await page.getByRole("button", { name: /Place order/ }).click();

  // Success page
  await page.waitForURL(/\/order\/TZ-\d{4}-\d+\?t=/);
  await expect(page.getByRole("heading", { name: "Your order has been placed" })).toBeVisible();
  const orderNumber = page.url().match(/TZ-\d{4}-\d+/)![0];
  await expect(page.getByRole("link", { name: "Confirm your order on WhatsApp" })).toHaveAttribute("href", new RegExp(orderNumber));

  // Admin: logged out → redirected to login
  await page.goto("/admin/orders");
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.fill("#email", "admin@tanzaib.pk");
  await page.fill("#password", "e2e-admin-pass");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin\/orders/);
  const row = page.getByRole("row", { name: new RegExp(orderNumber) });
  await expect(row).toBeVisible();
  await expect(row).toContainText("E2E Tester");
  await expect(row).toContainText("Rs. 18,500");
  await expect(row).toContainText(/pending/i);
});

test("admin is closed to anonymous visitors", async ({ page, request }) => {
  await page.goto("/admin/products");
  await expect(page).toHaveURL(/\/admin\/login/);
  const res = await request.get("/api/admin/export/orders");
  expect(res.status()).toBe(403);
});
