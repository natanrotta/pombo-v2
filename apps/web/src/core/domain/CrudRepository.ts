import type { PaginatedResponse, PaginationParams } from "@/shared/types/pagination";

export interface BaseEntity {
  id: string;
}

export interface CrudRepository<T extends BaseEntity, TCreate = Partial<T>, TUpdate = Partial<T>> {
  list(): Promise<T[]>;
  listPaginated(params: PaginationParams): Promise<PaginatedResponse<T>>;
  getById(id: string): Promise<T | null>;
  create(input: TCreate): Promise<T>;
  update(id: string, input: TUpdate): Promise<T>;
  delete(id: string): Promise<void>;
}

export interface BulkDeletable {
  bulkDelete(ids: string[]): Promise<void>;
}
