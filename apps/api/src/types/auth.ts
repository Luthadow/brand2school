export type AuthUser = {
  id: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN_STAFF" | "SCHOOL_ADMIN" | "BRAND_ADMIN" | "JUDGE" | "LEARNER";
  brandId?: string;
};
