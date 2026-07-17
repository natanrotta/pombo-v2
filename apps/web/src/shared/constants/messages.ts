import i18n from "@/shared/i18n";

export const errorMessages = {
  crud: (entity: string) => ({
    create: i18n.t("errors.createFailed", { entity, ns: "common" }),
    update: i18n.t("errors.updateFailed", { entity, ns: "common" }),
    delete: i18n.t("errors.deleteFailed", { entity, ns: "common" }),
    bulkDelete: i18n.t("errors.bulkDeleteFailed", { entity, ns: "common" }),
  }),

  action: (action: string, entity: string) =>
    i18n.t("errors.actionFailed", { action, entity, ns: "common" }),

  avatar: () => ({
    upload: i18n.t("avatar.updateError", { ns: "common" }),
    remove: i18n.t("avatar.removeError", { ns: "common" }),
  }),
} as const;
