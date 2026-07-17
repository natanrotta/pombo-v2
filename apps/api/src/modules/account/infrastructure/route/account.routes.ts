import { Router } from "express";
import { container } from "tsyringe";
import { AccountController } from "../controller/account.controller";
import { asyncHandler, authMiddleware } from "@core/http/middlewares";

const accountRoutes = Router();
const accountController = container.resolve(AccountController);

// Every account route requires an authenticated session (JWT).
accountRoutes.use(authMiddleware());

// The API-token metadata for the current account (null if never generated).
accountRoutes.get(
  "/api-token",
  asyncHandler(accountController.getApiToken.bind(accountController)),
);

// Generate a new API token (revokes the previous active one). 201 + the clear
// token, shown exactly once.
accountRoutes.post(
  "/api-token",
  asyncHandler(accountController.generateApiToken.bind(accountController)),
);

export { accountRoutes };
