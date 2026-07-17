export interface EntityQueryKeys {
  all: readonly unknown[];
  list: () => readonly unknown[];
  search: () => readonly unknown[];
  detail?: (id: string) => readonly unknown[];
}

export interface EntityQueryKeysWithDetail extends EntityQueryKeys {
  detail: (id: string) => readonly unknown[];
}
