import { test as base } from "@playwright/test";

export type AuthUser = {
  email: string;
  token: string;
};

type Fixtures = {
  authenticatedUser: AuthUser;
  adminUser: AuthUser;
};

export const test = base.extend<Fixtures>({
  authenticatedUser: async ({ page }, use) => {
    const user: AuthUser = {
      email: "user@test.com",
      token: "test-token",
    };

    await page.addInitScript((authData) => {
      localStorage.setItem("firebase:auth:token", authData.token);
      localStorage.setItem(
        "firebase:auth:user",
        JSON.stringify({ email: authData.email })
      );
    }, user);

    await use(user);
  },

  adminUser: async ({ page }, use) => {
    const admin: AuthUser = {
      email: "admin@test.com",
      token: "admin-token",
    };

    await page.addInitScript((authData) => {
      localStorage.setItem("firebase:auth:token", authData.token);
      localStorage.setItem(
        "firebase:auth:user",
        JSON.stringify({ email: authData.email, isAdmin: true })
      );
    }, admin);

    await use(admin);
  },
});

export { expect } from "@playwright/test";
