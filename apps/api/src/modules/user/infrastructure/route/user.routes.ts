import { Router } from "express";
import { container } from "tsyringe";
import { UserController } from "../controller/user.controller";
import {
  validateRequest,
  asyncHandler,
  authMiddleware,
} from "@core/http/middlewares";
import {
  CreateUserDTOSchema,
  UpdateUserDTOSchema,
  UserIdParamSchema,
} from "@modules/user/application/dto/user.dto";

const userRoutes = Router();
const userController = container.resolve(UserController);

// Every user-management route requires an authenticated session.
userRoutes.use(authMiddleware);

userRoutes.get("/", asyncHandler(userController.list.bind(userController)));

userRoutes.post(
  "/",
  validateRequest({ body: CreateUserDTOSchema }),
  asyncHandler(userController.create.bind(userController)),
);

userRoutes.get(
  "/:id",
  validateRequest({ params: UserIdParamSchema }),
  asyncHandler(userController.getById.bind(userController)),
);

userRoutes.put(
  "/:id",
  validateRequest({ params: UserIdParamSchema, body: UpdateUserDTOSchema }),
  asyncHandler(userController.update.bind(userController)),
);

userRoutes.delete(
  "/:id",
  validateRequest({ params: UserIdParamSchema }),
  asyncHandler(userController.remove.bind(userController)),
);

export { userRoutes };
