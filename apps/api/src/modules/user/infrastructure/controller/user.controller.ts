import { Request, Response } from "express";
import { container } from "tsyringe";
import {
  ListUsersUseCase,
  GetUserUseCase,
  CreateUserUseCase,
  UpdateUserUseCase,
  DeleteUserUseCase,
} from "@modules/user/application/use-case/user";

/**
 * User management (CRUD). All routes sit behind the auth middleware — see
 * `user.routes.ts`. The authenticated user's own profile is managed via the
 * `auth` module (`GET /auth/me`, `PUT /auth/profile`).
 */
export class UserController {
  async list(_req: Request, res: Response): Promise<Response> {
    const useCase = container.resolve(ListUsersUseCase);
    const result = await useCase.execute();
    return res.status(200).json({ ok: true, data: result });
  }

  async getById(req: Request, res: Response): Promise<Response> {
    const { id } = req.params as { id: string };
    const useCase = container.resolve(GetUserUseCase);
    const result = await useCase.execute(id);
    return res.status(200).json({ ok: true, data: result });
  }

  async create(req: Request, res: Response): Promise<Response> {
    const useCase = container.resolve(CreateUserUseCase);
    const result = await useCase.execute(req.body);
    return res.status(201).json({ ok: true, data: result });
  }

  async update(req: Request, res: Response): Promise<Response> {
    const { id } = req.params as { id: string };
    const useCase = container.resolve(UpdateUserUseCase);
    const result = await useCase.execute(id, req.body);
    return res.status(200).json({ ok: true, data: result });
  }

  async remove(req: Request, res: Response): Promise<Response> {
    const { id } = req.params as { id: string };
    const useCase = container.resolve(DeleteUserUseCase);
    await useCase.execute(id);
    return res.status(204).send();
  }
}
