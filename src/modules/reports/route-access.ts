import "server-only";

import { getFreshApiIdentity, type AuthIdentity } from "@/core/auth/session";
import {
  getCurrentStoreContext,
  type StoreContext,
  type StoreRole,
} from "@/core/data/tenant";
import { AcquisitionError } from "@/modules/acquisition/errors";

export function assertTenantAccess(input: {
  requestedStoreId: string;
  identity: AuthIdentity | null;
  store: StoreContext | null;
  roles?: readonly StoreRole[];
}) {
  if (!input.identity) {
    throw new AcquisitionError(
      "AUTHENTICATION_REQUIRED",
      401,
      "يلزم تسجيل الدخول للوصول إلى تقارير المتجر.",
    );
  }
  if (!input.store) {
    throw new AcquisitionError("STORE_REQUIRED", 409, "لم يتم العثور على مساحة متجر نشطة.");
  }
  if (input.store.storeId !== input.requestedStoreId) {
    throw new AcquisitionError("FORBIDDEN", 403, "لا تملك صلاحية الوصول إلى هذا المتجر.");
  }
  if (input.roles && !input.roles.includes(input.store.role)) {
    throw new AcquisitionError("FORBIDDEN", 403, "لا تملك الصلاحية المطلوبة لهذه العملية.");
  }
  return { identity: input.identity, store: input.store };
}
export async function authorizeTenantRoute(
  requestedStoreId: string,
  roles?: readonly StoreRole[],
) {
  const [identity, store] = await Promise.all([
    getFreshApiIdentity(),
    getCurrentStoreContext(),
  ]);
  return assertTenantAccess({ requestedStoreId, identity, store, roles });
}
