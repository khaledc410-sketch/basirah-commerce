import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  vector,
} from "drizzle-orm/pg-core";

export type JsonPrimitive = boolean | number | string | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

const createdAt = () =>
  timestamp("created_at", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull();

const updatedAt = () =>
  timestamp("updated_at", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull();

const emptyJson = sql`'{}'::jsonb`;

export const commercePlatformEnum = pgEnum("commerce_platform", ["salla", "zid"]);
export const runtimeModeEnum = pgEnum("runtime_mode", ["live", "demo"]);
export const organizationRoleEnum = pgEnum("organization_role", [
  "owner",
  "admin",
  "member",
]);
export const storeMemberRoleEnum = pgEnum("store_member_role", [
  "owner",
  "admin",
  "analyst",
  "support",
  "viewer",
]);
export const storeStatusEnum = pgEnum("store_status", [
  "onboarding",
  "active",
  "suspended",
  "disconnected",
  "archived",
]);
export const connectionStatusEnum = pgEnum("connection_status", [
  "pending",
  "connected",
  "degraded",
  "revoked",
  "disconnected",
]);
export const capabilityAccessEnum = pgEnum("capability_access", [
  "unknown",
  "available",
  "limited",
  "unavailable",
  "pending_verification",
]);
export const jobStatusEnum = pgEnum("job_status", [
  "queued",
  "running",
  "succeeded",
  "failed",
  "cancelled",
  "dead_letter",
]);
export const syncKindEnum = pgEnum("sync_kind", [
  "initial",
  "incremental",
  "historical",
  "reconciliation",
]);
export const deliveryStatusEnum = pgEnum("delivery_status", [
  "pending",
  "processing",
  "delivered",
  "failed",
  "dead_letter",
]);
export const productStatusEnum = pgEnum("product_status", [
  "draft",
  "active",
  "out_of_stock",
  "archived",
]);
export const documentKindEnum = pgEnum("document_kind", [
  "faq",
  "policy",
  "manual",
  "ingredient_sheet",
  "size_guide",
  "brand_guide",
  "product_guide",
  "store_page",
  "other",
]);
export const documentStatusEnum = pgEnum("document_status", [
  "uploaded",
  "processing",
  "ready",
  "failed",
  "archived",
]);
export const policyTypeEnum = pgEnum("policy_type", [
  "shipping",
  "returns",
  "refunds",
  "warranty",
  "privacy",
  "terms",
  "payment",
  "other",
]);
export const localeEnum = pgEnum("content_locale", ["ar", "en"]);
export const consentStateEnum = pgEnum("consent_state", [
  "unknown",
  "granted",
  "denied",
  "not_required",
]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "processing",
  "completed",
  "cancelled",
  "refunded",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "paid",
  "partially_refunded",
  "refunded",
  "failed",
]);
export const fulfillmentStatusEnum = pgEnum("fulfillment_status", [
  "unfulfilled",
  "partial",
  "fulfilled",
  "returned",
]);
export const cartStatusEnum = pgEnum("cart_status", [
  "active",
  "converted",
  "abandoned",
  "expired",
]);
export const attributionTypeEnum = pgEnum("attribution_type", [
  "direct_ai_assisted",
  "influenced",
]);
export const conversationStatusEnum = pgEnum("conversation_status", [
  "active",
  "completed",
  "abandoned",
  "handed_off",
]);
export const messageRoleEnum = pgEnum("message_role", [
  "customer",
  "assistant",
  "merchant",
  "system",
  "tool",
]);
export const recommendationStatusEnum = pgEnum("recommendation_status", [
  "generated",
  "shown",
  "accepted",
  "rejected",
  "failed",
]);
export const eventNameEnum = pgEnum("event_name", [
  "widget_loaded",
  "chat_opened",
  "conversation_started",
  "message_sent",
  "intent_detected",
  "recommendation_shown",
  "product_clicked",
  "product_viewed",
  "product_compared",
  "product_added_to_cart",
  "checkout_started",
  "purchase_completed",
  "conversation_abandoned",
  "human_handoff_requested",
  "ai_answer_failed",
  "visibility_check_started",
  "visibility_check_completed",
  "content_draft_created",
  "content_change_approved",
  "content_change_published",
]);
export const handoffStatusEnum = pgEnum("handoff_status", [
  "open",
  "assigned",
  "resolved",
  "cancelled",
]);
export const priorityEnum = pgEnum("priority", ["low", "medium", "high", "urgent"]);
export const insightKindEnum = pgEnum("insight_kind", [
  "observation",
  "inference",
  "trend",
  "anomaly",
]);
export const opportunityStatusEnum = pgEnum("opportunity_status", [
  "open",
  "in_progress",
  "approved",
  "dismissed",
  "completed",
]);
export const contentTypeEnum = pgEnum("content_type", [
  "product_title",
  "product_description",
  "faq",
  "comparison",
  "collection_description",
  "about_page",
  "shipping_page",
  "return_page",
  "metadata",
  "structured_data",
  "other",
]);
export const draftStatusEnum = pgEnum("draft_status", [
  "draft",
  "pending_approval",
  "approved",
  "rejected",
  "published",
  "superseded",
]);
export const approvalDecisionEnum = pgEnum("approval_decision", [
  "pending",
  "approved",
  "rejected",
  "cancelled",
]);
export const publicationStatusEnum = pgEnum("publication_status", [
  "queued",
  "running",
  "succeeded",
  "failed",
  "rolled_back",
]);
export const visibilityCheckStatusEnum = pgEnum("visibility_check_status", [
  "queued",
  "running",
  "succeeded",
  "unavailable",
  "failed",
]);
export const sentimentEnum = pgEnum("sentiment", [
  "positive",
  "neutral",
  "negative",
  "mixed",
  "unknown",
]);
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "trialing",
  "active",
  "past_due",
  "paused",
  "cancelled",
  "expired",
]);
export const billingIntervalEnum = pgEnum("billing_interval", ["month", "year"]);
export const prospectScanStatusEnum = pgEnum("prospect_scan_status", [
  "queued",
  "running",
  "completed",
  "failed",
  "expired",
]);
export const reportAccessLevelEnum = pgEnum("report_access_level", ["preview", "full"]);
export const reportOrderStatusEnum = pgEnum("report_order_status", [
  "pending_payment",
  "paid",
  "fulfilled",
  "cancelled",
  "refunded",
]);
export const providerCapabilityStateEnum = pgEnum("provider_capability_state", [
  "manual",
  "verified",
  "unavailable",
  "degraded",
  "pending_verification",
]);

export const users = pgTable(
  "users",
  {
    // The public profile is keyed by the immutable Supabase auth.users id.
    id: uuid("id").primaryKey(),
    email: text("email").notNull(),
    emailVerifiedAt: timestamp("email_verified_at", {
      mode: "date",
      withTimezone: true,
    }),
    displayName: text("display_name"),
    preferredLocale: localeEnum("preferred_locale").default("ar").notNull(),
    disabledAt: timestamp("disabled_at", { mode: "date", withTimezone: true }),
    lastSignedInAt: timestamp("last_signed_in_at", {
      mode: "date",
      withTimezone: true,
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("users_email_unique").on(sql`lower(${table.email})`),
    check("users_email_not_blank", sql`length(trim(${table.email})) > 3`),
  ],
);

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    accountType: text("account_type").notNull(),
    accessTokenEncrypted: text("access_token_encrypted"),
    refreshTokenEncrypted: text("refresh_token_encrypted"),
    tokenKeyVersion: integer("token_key_version"),
    tokenExpiresAt: timestamp("token_expires_at", {
      mode: "date",
      withTimezone: true,
    }),
    scopes: text("scopes").array().default(sql`ARRAY[]::text[]`).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("accounts_provider_account_unique").on(
      table.provider,
      table.providerAccountId,
    ),
    index("accounts_user_id_idx").on(table.userId),
  ],
);

export const authSessions = pgTable(
  "auth_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sessionTokenHash: text("session_token_hash").notNull(),
    ipAddressHash: text("ip_address_hash"),
    userAgent: text("user_agent"),
    expiresAt: timestamp("expires_at", { mode: "date", withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { mode: "date", withTimezone: true }),
    lastSeenAt: timestamp("last_seen_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex("auth_sessions_token_hash_unique").on(table.sessionTokenHash),
    index("auth_sessions_user_expiry_idx").on(table.userId, table.expiresAt),
    index("auth_sessions_active_expiry_idx")
      .on(table.expiresAt)
      .where(sql`${table.revokedAt} is null`),
    check("auth_sessions_expiry_after_creation", sql`${table.expiresAt} > ${table.createdAt}`),
  ],
);

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    status: text("status").default("active").notNull(),
    archivedAt: timestamp("archived_at", { mode: "date", withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("organizations_slug_unique").on(sql`lower(${table.slug})`),
    check("organizations_name_not_blank", sql`length(trim(${table.name})) > 0`),
  ],
);

export const organizationMembers = pgTable(
  "organization_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    role: organizationRoleEnum("role").notNull(),
    invitedByUserId: uuid("invited_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    joinedAt: timestamp("joined_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    disabledAt: timestamp("disabled_at", { mode: "date", withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("organization_members_org_user_unique").on(
      table.organizationId,
      table.userId,
    ),
    index("organization_members_user_id_idx").on(table.userId),
    index("organization_members_user_active_idx")
      .on(table.userId, table.organizationId, table.role)
      .where(sql`${table.disabledAt} is null`),
    index("organization_members_invited_by_idx").on(table.invitedByUserId),
  ],
);

export const stores = pgTable(
  "stores",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    externalDomain: text("external_domain"),
    status: storeStatusEnum("status").default("onboarding").notNull(),
    runtimeMode: runtimeModeEnum("runtime_mode").default("live").notNull(),
    category: text("category").default("general_ecommerce").notNull(),
    defaultLocale: localeEnum("default_locale").default("ar").notNull(),
    currency: text("currency").default("SAR").notNull(),
    timezone: text("timezone").default("Asia/Riyadh").notNull(),
    brandVoiceInstructions: text("brand_voice_instructions"),
    dataRetentionDays: integer("data_retention_days").default(365).notNull(),
    archivedAt: timestamp("archived_at", { mode: "date", withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("stores_org_id_unique").on(table.organizationId, table.id),
    index("stores_organization_status_idx").on(table.organizationId, table.status),
    uniqueIndex("stores_org_domain_unique")
      .on(table.organizationId, sql`lower(${table.externalDomain})`)
      .where(sql`${table.externalDomain} is not null`),
    check("stores_currency_iso_length", sql`char_length(${table.currency}) = 3`),
    check("stores_retention_positive", sql`${table.dataRetentionDays} > 0`),
  ],
);

const storeId = () =>
  uuid("store_id")
    .notNull()
    .references(() => stores.id, { onDelete: "restrict" });

export const storeMembers = pgTable(
  "store_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    role: storeMemberRoleEnum("role").notNull(),
    invitedByUserId: uuid("invited_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    joinedAt: timestamp("joined_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    disabledAt: timestamp("disabled_at", { mode: "date", withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("store_members_store_user_unique").on(table.storeId, table.userId),
    unique("store_members_store_id_unique").on(table.storeId, table.id),
    index("store_members_user_id_idx").on(table.userId),
    index("store_members_invited_by_idx").on(table.invitedByUserId),
  ],
);

export const oauthStates = pgTable(
  "oauth_states",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    storeId: uuid("store_id").references(() => stores.id, { onDelete: "restrict" }),
    initiatedByUserId: uuid("initiated_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    platform: commercePlatformEnum("platform").notNull(),
    stateHash: text("state_hash").notNull(),
    codeVerifierEncrypted: text("code_verifier_encrypted"),
    redirectUri: text("redirect_uri").notNull(),
    expiresAt: timestamp("expires_at", { mode: "date", withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { mode: "date", withTimezone: true }),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex("oauth_states_hash_unique").on(table.stateHash),
    index("oauth_states_org_expiry_idx").on(table.organizationId, table.expiresAt),
    index("oauth_states_store_id_idx").on(table.storeId),
    index("oauth_states_user_id_idx").on(table.initiatedByUserId),
    check("oauth_states_expiry_after_creation", sql`${table.expiresAt} > ${table.createdAt}`),
  ],
);

/**
 * Easy Mode authorization can arrive before the merchant has an authenticated
 * Basirah workspace. These encrypted, short-lived records are bound only after
 * Salla's embedded token introspection proves the merchant id.
 */
export const pendingPlatformAuthorizations = pgTable(
  "pending_platform_authorizations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    platform: commercePlatformEnum("platform").notNull(),
    externalStoreId: text("external_store_id").notNull(),
    accessTokenEncrypted: text("access_token_encrypted").notNull(),
    authorizationTokenEncrypted: text("authorization_token_encrypted"),
    refreshTokenEncrypted: text("refresh_token_encrypted"),
    tokenExpiresAt: timestamp("token_expires_at", { mode: "date", withTimezone: true }).notNull(),
    scopes: text("scopes").array().default(sql`ARRAY[]::text[]`).notNull(),
    tokenType: text("token_type").default("bearer").notNull(),
    eventCreatedAt: timestamp("event_created_at", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    consumedAt: timestamp("consumed_at", { mode: "date", withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("pending_platform_authorizations_store_unique").on(
      table.platform,
      table.externalStoreId,
    ),
    index("pending_platform_authorizations_expiry_idx").on(
      table.tokenExpiresAt,
      table.consumedAt,
    ),
  ],
);

/**
 * Opaque, short-lived handoff claims used to move an embedded Salla install
 * into the authenticated account-linking flow. Only a SHA-256 digest is kept;
 * this table is service-only and intentionally has no tenant-facing policies.
 */
export const platformBindingClaims = pgTable(
  "platform_binding_claims",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    platform: commercePlatformEnum("platform").notNull(),
    externalStoreId: text("external_store_id").notNull(),
    externalUserId: text("external_user_id").notNull(),
    claimHash: text("claim_hash").notNull(),
    expiresAt: timestamp("expires_at", { mode: "date", withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { mode: "date", withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("platform_binding_claims_hash_unique").on(table.claimHash),
    index("platform_binding_claims_store_idx").on(
      table.platform,
      table.externalStoreId,
      table.consumedAt,
    ),
    index("platform_binding_claims_expiry_idx").on(table.expiresAt, table.consumedAt),
    check("platform_binding_claims_hash_length", sql`char_length(${table.claimHash}) = 64`),
    check(
      "platform_binding_claims_expiry_after_creation",
      sql`${table.expiresAt} > ${table.createdAt}`,
    ),
  ],
);

export const platformConnections = pgTable(
  "platform_connections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    platform: commercePlatformEnum("platform").notNull(),
    externalStoreId: text("external_store_id").notNull(),
    status: connectionStatusEnum("status").default("pending").notNull(),
    accessTokenEncrypted: text("access_token_encrypted").notNull(),
    authorizationTokenEncrypted: text("authorization_token_encrypted"),
    refreshTokenEncrypted: text("refresh_token_encrypted"),
    tokenKeyVersion: integer("token_key_version").default(1).notNull(),
    tokenVersion: integer("token_version").default(1).notNull(),
    tokenExpiresAt: timestamp("token_expires_at", {
      mode: "date",
      withTimezone: true,
    }),
    authorizationEventCreatedAt: timestamp("authorization_event_created_at", {
      mode: "date",
      withTimezone: true,
    }),
    scopes: text("scopes").array().default(sql`ARRAY[]::text[]`).notNull(),
    lastVerifiedAt: timestamp("last_verified_at", {
      mode: "date",
      withTimezone: true,
    }),
    disconnectedAt: timestamp("disconnected_at", {
      mode: "date",
      withTimezone: true,
    }),
    metadata: jsonb("metadata").$type<JsonObject>().default(emptyJson).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    unique("platform_connections_store_id_unique").on(table.storeId, table.id),
    uniqueIndex("platform_connections_store_platform_unique").on(
      table.storeId,
      table.platform,
    ),
    uniqueIndex("platform_connections_external_store_unique").on(
      table.platform,
      table.externalStoreId,
    ),
    index("platform_connections_status_idx").on(table.storeId, table.status),
    check("platform_connections_key_version_positive", sql`${table.tokenKeyVersion} > 0`),
    check("platform_connections_token_version_positive", sql`${table.tokenVersion} > 0`),
  ],
);

export const connectionCapabilities = pgTable(
  "connection_capabilities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    connectionId: uuid("connection_id").notNull(),
    capability: text("capability").notNull(),
    access: capabilityAccessEnum("access").default("unknown").notNull(),
    sourceReference: text("source_reference"),
    verifiedAt: timestamp("verified_at", { mode: "date", withTimezone: true }),
    details: jsonb("details").$type<JsonObject>().default(emptyJson).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    foreignKey({
      name: "connection_capabilities_connection_fk",
      columns: [table.storeId, table.connectionId],
      foreignColumns: [platformConnections.storeId, platformConnections.id],
    }).onDelete("cascade"),
    uniqueIndex("connection_capabilities_connection_name_unique").on(
      table.connectionId,
      table.capability,
    ),
    index("connection_capabilities_store_access_idx").on(table.storeId, table.access),
  ],
);

export const webhookRegistrations = pgTable(
  "webhook_registrations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    connectionId: uuid("connection_id").notNull(),
    eventType: text("event_type").notNull(),
    externalRegistrationId: text("external_registration_id"),
    callbackUrl: text("callback_url").notNull(),
    active: boolean("active").default(true).notNull(),
    lastVerifiedAt: timestamp("last_verified_at", {
      mode: "date",
      withTimezone: true,
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    foreignKey({
      name: "webhook_registrations_connection_fk",
      columns: [table.storeId, table.connectionId],
      foreignColumns: [platformConnections.storeId, platformConnections.id],
    }).onDelete("cascade"),
    uniqueIndex("webhook_registrations_connection_event_unique").on(
      table.connectionId,
      table.eventType,
    ),
    index("webhook_registrations_store_active_idx").on(table.storeId, table.active),
  ],
);

export const syncJobs = pgTable(
  "sync_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    runId: uuid("run_id").defaultRandom().notNull(),
    storeId: storeId(),
    connectionId: uuid("connection_id").notNull(),
    kind: syncKindEnum("kind").notNull(),
    resourceType: text("resource_type").notNull(),
    status: jobStatusEnum("status").default("queued").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    requestedByUserId: uuid("requested_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    recordsTotal: integer("records_total"),
    recordsProcessed: integer("records_processed").default(0).notNull(),
    recordsFailed: integer("records_failed").default(0).notNull(),
    cursor: jsonb("cursor").$type<JsonObject>(),
    startedAt: timestamp("started_at", { mode: "date", withTimezone: true }),
    heartbeatAt: timestamp("heartbeat_at", { mode: "date", withTimezone: true }),
    completedAt: timestamp("completed_at", { mode: "date", withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    foreignKey({
      name: "sync_jobs_connection_fk",
      columns: [table.storeId, table.connectionId],
      foreignColumns: [platformConnections.storeId, platformConnections.id],
    }).onDelete("restrict"),
    unique("sync_jobs_store_id_unique").on(table.storeId, table.id),
    uniqueIndex("sync_jobs_store_idempotency_unique").on(
      table.storeId,
      table.idempotencyKey,
    ),
    uniqueIndex("sync_jobs_store_run_resource_unique").on(
      table.storeId,
      table.runId,
      table.resourceType,
    ),
    uniqueIndex("sync_jobs_connection_active_resource_unique")
      .on(table.connectionId, table.resourceType)
      .where(sql`${table.status} in ('queued', 'running')`),
    index("sync_jobs_store_run_idx").on(table.storeId, table.runId),
    index("sync_jobs_store_status_created_idx").on(
      table.storeId,
      table.status,
      table.createdAt.desc(),
    ),
    index("sync_jobs_connection_idx").on(table.connectionId),
    index("sync_jobs_requested_by_idx").on(table.requestedByUserId),
    check("sync_jobs_counts_nonnegative", sql`
      ${table.recordsProcessed} >= 0
      and ${table.recordsFailed} >= 0
      and (${table.recordsTotal} is null or ${table.recordsTotal} >= 0)
    `),
    check(
      "sync_jobs_processed_within_total",
      sql`${table.recordsTotal} is null or (${table.recordsProcessed} + ${table.recordsFailed}) <= ${table.recordsTotal}`,
    ),
  ],
);

export const syncCheckpoints = pgTable(
  "sync_checkpoints",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    connectionId: uuid("connection_id").notNull(),
    resourceType: text("resource_type").notNull(),
    cursor: jsonb("cursor").$type<JsonObject>().notNull(),
    sourceVersion: text("source_version"),
    lastExternalUpdatedAt: timestamp("last_external_updated_at", {
      mode: "date",
      withTimezone: true,
    }),
    lastSuccessfulSyncAt: timestamp("last_successful_sync_at", {
      mode: "date",
      withTimezone: true,
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    foreignKey({
      name: "sync_checkpoints_connection_fk",
      columns: [table.storeId, table.connectionId],
      foreignColumns: [platformConnections.storeId, platformConnections.id],
    }).onDelete("cascade"),
    uniqueIndex("sync_checkpoints_connection_resource_unique").on(
      table.connectionId,
      table.resourceType,
    ),
    index("sync_checkpoints_store_id_idx").on(table.storeId),
  ],
);

export const syncErrors = pgTable(
  "sync_errors",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    syncJobId: uuid("sync_job_id").notNull(),
    resourceType: text("resource_type").notNull(),
    externalId: text("external_id"),
    errorCode: text("error_code"),
    message: text("message").notNull(),
    retryable: boolean("retryable").default(false).notNull(),
    details: jsonb("details").$type<JsonObject>().default(emptyJson).notNull(),
    occurredAt: timestamp("occurred_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    resolvedAt: timestamp("resolved_at", { mode: "date", withTimezone: true }),
    createdAt: createdAt(),
  },
  (table) => [
    foreignKey({
      name: "sync_errors_job_fk",
      columns: [table.storeId, table.syncJobId],
      foreignColumns: [syncJobs.storeId, syncJobs.id],
    }).onDelete("cascade"),
    index("sync_errors_job_occurred_idx").on(
      table.syncJobId,
      table.occurredAt.desc(),
    ),
    index("sync_errors_store_unresolved_idx")
      .on(table.storeId, table.occurredAt.desc())
      .where(sql`${table.resolvedAt} is null`),
  ],
);

export const jobRuns = pgTable(
  "job_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    syncJobId: uuid("sync_job_id"),
    queueName: text("queue_name").notNull(),
    jobName: text("job_name").notNull(),
    externalJobId: text("external_job_id"),
    attemptNumber: integer("attempt_number").default(1).notNull(),
    status: jobStatusEnum("status").default("queued").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    input: jsonb("input").$type<JsonObject>().default(emptyJson).notNull(),
    output: jsonb("output").$type<JsonObject>(),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    scheduledFor: timestamp("scheduled_for", { mode: "date", withTimezone: true }),
    startedAt: timestamp("started_at", { mode: "date", withTimezone: true }),
    finishedAt: timestamp("finished_at", { mode: "date", withTimezone: true }),
    createdAt: createdAt(),
  },
  (table) => [
    foreignKey({
      name: "job_runs_sync_job_fk",
      columns: [table.storeId, table.syncJobId],
      foreignColumns: [syncJobs.storeId, syncJobs.id],
    }).onDelete("cascade"),
    uniqueIndex("job_runs_store_idempotency_attempt_unique").on(
      table.storeId,
      table.idempotencyKey,
      table.attemptNumber,
    ),
    index("job_runs_store_status_scheduled_idx").on(
      table.storeId,
      table.status,
      table.scheduledFor,
    ),
    index("job_runs_sync_job_idx").on(table.syncJobId),
    check("job_runs_attempt_positive", sql`${table.attemptNumber} > 0`),
  ],
);

export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    connectionId: uuid("connection_id").notNull(),
    platform: commercePlatformEnum("platform").notNull(),
    eventType: text("event_type").notNull(),
    providerDeliveryId: text("provider_delivery_id"),
    idempotencyKey: text("idempotency_key").notNull(),
    signatureVerified: boolean("signature_verified").default(false).notNull(),
    headers: jsonb("headers").$type<JsonObject>().default(emptyJson).notNull(),
    payload: jsonb("payload").$type<JsonValue>().notNull(),
    payloadHash: text("payload_hash").notNull(),
    status: deliveryStatusEnum("status").default("pending").notNull(),
    attemptCount: integer("attempt_count").default(0).notNull(),
    receivedAt: timestamp("received_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    processedAt: timestamp("processed_at", { mode: "date", withTimezone: true }),
    failedAt: timestamp("failed_at", { mode: "date", withTimezone: true }),
    lastError: text("last_error"),
    createdAt: createdAt(),
  },
  (table) => [
    foreignKey({
      name: "webhook_events_connection_fk",
      columns: [table.storeId, table.connectionId],
      foreignColumns: [platformConnections.storeId, platformConnections.id],
    }).onDelete("restrict"),
    uniqueIndex("webhook_events_store_idempotency_unique").on(
      table.storeId,
      table.idempotencyKey,
    ),
    uniqueIndex("webhook_events_provider_delivery_unique")
      .on(table.platform, table.storeId, table.providerDeliveryId)
      .where(sql`${table.providerDeliveryId} is not null`),
    index("webhook_events_store_status_received_idx").on(
      table.storeId,
      table.status,
      table.receivedAt,
    ),
    index("webhook_events_connection_idx").on(table.connectionId),
    check("webhook_events_attempt_nonnegative", sql`${table.attemptCount} >= 0`),
  ],
);

export const outboxEvents = pgTable(
  "outbox_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    aggregateType: text("aggregate_type").notNull(),
    aggregateId: text("aggregate_id").notNull(),
    eventType: text("event_type").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    payload: jsonb("payload").$type<JsonObject>().notNull(),
    status: deliveryStatusEnum("status").default("pending").notNull(),
    attemptCount: integer("attempt_count").default(0).notNull(),
    availableAt: timestamp("available_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    lockedAt: timestamp("locked_at", { mode: "date", withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { mode: "date", withTimezone: true }),
    lastError: text("last_error"),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex("outbox_events_store_idempotency_unique").on(
      table.storeId,
      table.idempotencyKey,
    ),
    index("outbox_events_dispatch_idx")
      .on(table.status, table.availableAt, table.createdAt)
      .where(sql`${table.status} in ('pending', 'failed')`),
    index("outbox_events_store_aggregate_idx").on(
      table.storeId,
      table.aggregateType,
      table.aggregateId,
    ),
    check("outbox_events_attempt_nonnegative", sql`${table.attemptCount} >= 0`),
  ],
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    externalId: text("external_id").notNull(),
    sku: text("sku"),
    slug: text("slug"),
    status: productStatusEnum("status").default("draft").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    currency: text("currency").default("SAR").notNull(),
    priceMinor: bigint("price_minor", { mode: "number" }).notNull(),
    compareAtPriceMinor: bigint("compare_at_price_minor", { mode: "number" }),
    costMinor: bigint("cost_minor", { mode: "number" }),
    stockQuantity: integer("stock_quantity"),
    trackInventory: boolean("track_inventory").default(true).notNull(),
    availableForSale: boolean("available_for_sale").default(false).notNull(),
    sourceVersion: text("source_version"),
    sourceUpdatedAt: timestamp("source_updated_at", {
      mode: "date",
      withTimezone: true,
    }),
    sourceSeenAt: timestamp("source_seen_at", {
      mode: "date",
      withTimezone: true,
    }),
    sourceDeletedAt: timestamp("source_deleted_at", {
      mode: "date",
      withTimezone: true,
    }),
    metadata: jsonb("metadata").$type<JsonObject>().default(emptyJson).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    unique("products_store_id_unique").on(table.storeId, table.id),
    uniqueIndex("products_store_external_unique").on(table.storeId, table.externalId),
    uniqueIndex("products_store_slug_unique")
      .on(table.storeId, table.slug)
      .where(sql`${table.slug} is not null and ${table.sourceDeletedAt} is null`),
    index("products_store_eligible_idx")
      .on(table.storeId, table.availableForSale, table.updatedAt.desc())
      .where(sql`${table.status} = 'active' and ${table.sourceDeletedAt} is null`),
    index("products_store_sku_idx").on(table.storeId, table.sku),
    index("products_store_source_seen_idx").on(table.storeId, table.sourceSeenAt),
    check("products_price_nonnegative", sql`
      ${table.priceMinor} >= 0
      and (${table.compareAtPriceMinor} is null or ${table.compareAtPriceMinor} >= 0)
      and (${table.costMinor} is null or ${table.costMinor} >= 0)
    `),
    check(
      "products_stock_nonnegative",
      sql`${table.stockQuantity} is null or ${table.stockQuantity} >= 0`,
    ),
    check("products_currency_iso_length", sql`char_length(${table.currency}) = 3`),
  ],
);

export const productTranslations = pgTable(
  "product_translations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    productId: uuid("product_id").notNull(),
    locale: localeEnum("locale").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    foreignKey({
      name: "product_translations_product_fk",
      columns: [table.storeId, table.productId],
      foreignColumns: [products.storeId, products.id],
    }).onDelete("cascade"),
    uniqueIndex("product_translations_product_locale_unique").on(
      table.productId,
      table.locale,
    ),
    index("product_translations_store_locale_idx").on(table.storeId, table.locale),
  ],
);

export const productMedia = pgTable(
  "product_media",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    productId: uuid("product_id").notNull(),
    externalId: text("external_id"),
    mediaType: text("media_type").default("image").notNull(),
    url: text("url").notNull(),
    altText: text("alt_text"),
    locale: localeEnum("locale"),
    position: integer("position").default(0).notNull(),
    width: integer("width"),
    height: integer("height"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    foreignKey({
      name: "product_media_product_fk",
      columns: [table.storeId, table.productId],
      foreignColumns: [products.storeId, products.id],
    }).onDelete("cascade"),
    uniqueIndex("product_media_product_url_unique").on(table.productId, table.url),
    index("product_media_product_position_idx").on(table.productId, table.position),
    index("product_media_store_id_idx").on(table.storeId),
    check("product_media_position_nonnegative", sql`${table.position} >= 0`),
    check(
      "product_media_dimensions_positive",
      sql`(${table.width} is null or ${table.width} > 0) and (${table.height} is null or ${table.height} > 0)`,
    ),
  ],
);

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    productId: uuid("product_id").notNull(),
    externalId: text("external_id").notNull(),
    sku: text("sku"),
    title: text("title").notNull(),
    currency: text("currency").default("SAR").notNull(),
    priceMinor: bigint("price_minor", { mode: "number" }).notNull(),
    compareAtPriceMinor: bigint("compare_at_price_minor", { mode: "number" }),
    stockQuantity: integer("stock_quantity"),
    availableForSale: boolean("available_for_sale").default(false).notNull(),
    attributes: jsonb("attributes").$type<JsonObject>().default(emptyJson).notNull(),
    sourceVersion: text("source_version"),
    sourceUpdatedAt: timestamp("source_updated_at", {
      mode: "date",
      withTimezone: true,
    }),
    sourceDeletedAt: timestamp("source_deleted_at", {
      mode: "date",
      withTimezone: true,
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    foreignKey({
      name: "product_variants_product_fk",
      columns: [table.storeId, table.productId],
      foreignColumns: [products.storeId, products.id],
    }).onDelete("cascade"),
    unique("product_variants_store_id_unique").on(table.storeId, table.id),
    uniqueIndex("product_variants_store_external_unique").on(
      table.storeId,
      table.externalId,
    ),
    index("product_variants_product_available_idx").on(
      table.productId,
      table.availableForSale,
    ),
    index("product_variants_store_sku_idx").on(table.storeId, table.sku),
    check("product_variants_price_nonnegative", sql`
      ${table.priceMinor} >= 0
      and (${table.compareAtPriceMinor} is null or ${table.compareAtPriceMinor} >= 0)
    `),
    check(
      "product_variants_stock_nonnegative",
      sql`${table.stockQuantity} is null or ${table.stockQuantity} >= 0`,
    ),
    check("product_variants_currency_iso_length", sql`char_length(${table.currency}) = 3`),
  ],
);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    externalId: text("external_id").notNull(),
    parentId: uuid("parent_id"),
    parentExternalId: text("parent_external_id"),
    name: text("name").notNull(),
    slug: text("slug"),
    description: text("description"),
    position: integer("position").default(0).notNull(),
    active: boolean("active").default(true).notNull(),
    sourceUpdatedAt: timestamp("source_updated_at", {
      mode: "date",
      withTimezone: true,
    }),
    sourceSeenAt: timestamp("source_seen_at", {
      mode: "date",
      withTimezone: true,
    }),
    sourceDeletedAt: timestamp("source_deleted_at", {
      mode: "date",
      withTimezone: true,
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    unique("categories_store_id_unique").on(table.storeId, table.id),
    foreignKey({
      name: "categories_parent_fk",
      columns: [table.storeId, table.parentId],
      foreignColumns: [table.storeId, table.id],
    }).onDelete("restrict"),
    uniqueIndex("categories_store_external_unique").on(table.storeId, table.externalId),
    index("categories_store_parent_idx").on(table.storeId, table.parentId),
    index("categories_store_active_idx").on(table.storeId, table.active),
    index("categories_store_source_seen_idx").on(table.storeId, table.sourceSeenAt),
    check("categories_position_nonnegative", sql`${table.position} >= 0`),
  ],
);

export const productCategories = pgTable(
  "product_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    productId: uuid("product_id").notNull(),
    categoryId: uuid("category_id").notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    foreignKey({
      name: "product_categories_product_fk",
      columns: [table.storeId, table.productId],
      foreignColumns: [products.storeId, products.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "product_categories_category_fk",
      columns: [table.storeId, table.categoryId],
      foreignColumns: [categories.storeId, categories.id],
    }).onDelete("cascade"),
    uniqueIndex("product_categories_product_category_unique").on(
      table.productId,
      table.categoryId,
    ),
    index("product_categories_category_product_idx").on(
      table.categoryId,
      table.productId,
    ),
    index("product_categories_store_id_idx").on(table.storeId),
  ],
);

export const productAttributes = pgTable(
  "product_attributes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    productId: uuid("product_id").notNull(),
    key: text("key").notNull(),
    values: jsonb("values").$type<string[]>().default(sql`'[]'::jsonb`).notNull(),
    locale: localeEnum("locale"),
    source: text("source").default("platform").notNull(),
    verified: boolean("verified").default(false).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    foreignKey({
      name: "product_attributes_product_fk",
      columns: [table.storeId, table.productId],
      foreignColumns: [products.storeId, products.id],
    }).onDelete("cascade"),
    unique("product_attributes_product_key_locale_unique")
      .on(table.productId, table.key, table.locale)
      .nullsNotDistinct(),
    index("product_attributes_store_key_idx").on(table.storeId, table.key),
  ],
);

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    kind: documentKindEnum("kind").notNull(),
    status: documentStatusEnum("status").default("uploaded").notNull(),
    title: text("title").notNull(),
    locale: localeEnum("locale"),
    sourceUrl: text("source_url"),
    storageKey: text("storage_key"),
    mimeType: text("mime_type"),
    checksumSha256: text("checksum_sha256").notNull(),
    byteSize: bigint("byte_size", { mode: "number" }),
    extractedText: text("extracted_text"),
    sourceUpdatedAt: timestamp("source_updated_at", {
      mode: "date",
      withTimezone: true,
    }),
    metadata: jsonb("metadata").$type<JsonObject>().default(emptyJson).notNull(),
    archivedAt: timestamp("archived_at", { mode: "date", withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    unique("documents_store_id_unique").on(table.storeId, table.id),
    uniqueIndex("documents_store_checksum_unique").on(
      table.storeId,
      table.checksumSha256,
    ),
    index("documents_store_status_kind_idx").on(table.storeId, table.status, table.kind),
    check(
      "documents_byte_size_nonnegative",
      sql`${table.byteSize} is null or ${table.byteSize} >= 0`,
    ),
  ],
);

export const productDocuments = pgTable(
  "product_documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    productId: uuid("product_id").notNull(),
    documentId: uuid("document_id").notNull(),
    relationship: text("relationship").default("reference").notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    foreignKey({
      name: "product_documents_product_fk",
      columns: [table.storeId, table.productId],
      foreignColumns: [products.storeId, products.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "product_documents_document_fk",
      columns: [table.storeId, table.documentId],
      foreignColumns: [documents.storeId, documents.id],
    }).onDelete("cascade"),
    uniqueIndex("product_documents_product_document_unique").on(
      table.productId,
      table.documentId,
    ),
    index("product_documents_document_idx").on(table.documentId),
    index("product_documents_store_id_idx").on(table.storeId),
  ],
);

export const documentChunks = pgTable(
  "document_chunks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    documentId: uuid("document_id").notNull(),
    chunkIndex: integer("chunk_index").notNull(),
    content: text("content").notNull(),
    locale: localeEnum("locale"),
    tokenCount: integer("token_count"),
    embeddingModel: text("embedding_model").notNull(),
    embedding: vector("embedding", { dimensions: 1536 }).notNull(),
    sourceMetadata: jsonb("source_metadata").$type<JsonObject>().default(emptyJson).notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    foreignKey({
      name: "document_chunks_document_fk",
      columns: [table.storeId, table.documentId],
      foreignColumns: [documents.storeId, documents.id],
    }).onDelete("cascade"),
    uniqueIndex("document_chunks_document_index_unique").on(
      table.documentId,
      table.chunkIndex,
    ),
    index("document_chunks_store_document_idx").on(table.storeId, table.documentId),
    index("document_chunks_embedding_hnsw_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
    check("document_chunks_index_nonnegative", sql`${table.chunkIndex} >= 0`),
    check(
      "document_chunks_token_count_nonnegative",
      sql`${table.tokenCount} is null or ${table.tokenCount} >= 0`,
    ),
  ],
);

export const storePolicies = pgTable(
  "store_policies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    documentId: uuid("document_id"),
    type: policyTypeEnum("type").notNull(),
    locale: localeEnum("locale").notNull(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    sourceUrl: text("source_url"),
    verifiedAt: timestamp("verified_at", { mode: "date", withTimezone: true }),
    sourceUpdatedAt: timestamp("source_updated_at", {
      mode: "date",
      withTimezone: true,
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    foreignKey({
      name: "store_policies_document_fk",
      columns: [table.storeId, table.documentId],
      foreignColumns: [documents.storeId, documents.id],
    }).onDelete("restrict"),
    uniqueIndex("store_policies_store_type_locale_unique").on(
      table.storeId,
      table.type,
      table.locale,
    ),
    index("store_policies_document_idx").on(table.documentId),
  ],
);

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    externalId: text("external_id").notNull(),
    displayName: text("display_name"),
    emailEncrypted: text("email_encrypted"),
    emailHash: text("email_hash"),
    phoneEncrypted: text("phone_encrypted"),
    phoneHash: text("phone_hash"),
    preferredLocale: localeEnum("preferred_locale"),
    consentState: consentStateEnum("consent_state").default("unknown").notNull(),
    consentUpdatedAt: timestamp("consent_updated_at", {
      mode: "date",
      withTimezone: true,
    }),
    firstSeenAt: timestamp("first_seen_at", { mode: "date", withTimezone: true }),
    lastSeenAt: timestamp("last_seen_at", { mode: "date", withTimezone: true }),
    sourceUpdatedAt: timestamp("source_updated_at", {
      mode: "date",
      withTimezone: true,
    }),
    sourceDeletedAt: timestamp("source_deleted_at", {
      mode: "date",
      withTimezone: true,
    }),
    metadata: jsonb("metadata").$type<JsonObject>().default(emptyJson).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    unique("customers_store_id_unique").on(table.storeId, table.id),
    uniqueIndex("customers_store_external_unique").on(table.storeId, table.externalId),
    index("customers_store_last_seen_idx").on(table.storeId, table.lastSeenAt.desc()),
    index("customers_store_email_hash_idx").on(table.storeId, table.emailHash),
    index("customers_store_phone_hash_idx").on(table.storeId, table.phoneHash),
  ],
);

export const visitors = pgTable(
  "visitors",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    anonymousIdHash: text("anonymous_id_hash").notNull(),
    customerId: uuid("customer_id"),
    firstSeenAt: timestamp("first_seen_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    lastSeenAt: timestamp("last_seen_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    locale: localeEnum("locale"),
    countryCode: text("country_code"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    foreignKey({
      name: "visitors_customer_fk",
      columns: [table.storeId, table.customerId],
      foreignColumns: [customers.storeId, customers.id],
    }).onDelete("restrict"),
    unique("visitors_store_id_unique").on(table.storeId, table.id),
    uniqueIndex("visitors_store_anonymous_unique").on(
      table.storeId,
      table.anonymousIdHash,
    ),
    index("visitors_customer_idx").on(table.customerId),
    index("visitors_store_last_seen_idx").on(table.storeId, table.lastSeenAt.desc()),
    check(
      "visitors_country_code_length",
      sql`${table.countryCode} is null or char_length(${table.countryCode}) = 2`,
    ),
  ],
);

export const widgetSessions = pgTable(
  "widget_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    visitorId: uuid("visitor_id").notNull(),
    customerId: uuid("customer_id"),
    sessionTokenHash: text("session_token_hash").notNull(),
    consentState: consentStateEnum("consent_state").default("unknown").notNull(),
    entryUrl: text("entry_url"),
    referrerUrl: text("referrer_url"),
    userAgent: text("user_agent"),
    openedAt: timestamp("opened_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    lastActivityAt: timestamp("last_activity_at", {
      mode: "date",
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
    endedAt: timestamp("ended_at", { mode: "date", withTimezone: true }),
    expiresAt: timestamp("expires_at", { mode: "date", withTimezone: true }).notNull(),
    metadata: jsonb("metadata").$type<JsonObject>().default(emptyJson).notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    foreignKey({
      name: "widget_sessions_visitor_fk",
      columns: [table.storeId, table.visitorId],
      foreignColumns: [visitors.storeId, visitors.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "widget_sessions_customer_fk",
      columns: [table.storeId, table.customerId],
      foreignColumns: [customers.storeId, customers.id],
    }).onDelete("restrict"),
    unique("widget_sessions_store_id_unique").on(table.storeId, table.id),
    uniqueIndex("widget_sessions_token_hash_unique").on(table.sessionTokenHash),
    index("widget_sessions_visitor_activity_idx").on(
      table.visitorId,
      table.lastActivityAt.desc(),
    ),
    index("widget_sessions_customer_idx").on(table.customerId),
    index("widget_sessions_store_expiry_idx").on(table.storeId, table.expiresAt),
    check("widget_sessions_expiry_after_open", sql`${table.expiresAt} > ${table.openedAt}`),
  ],
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    customerId: uuid("customer_id"),
    externalId: text("external_id").notNull(),
    externalNumber: text("external_number"),
    status: orderStatusEnum("status").notNull(),
    paymentStatus: paymentStatusEnum("payment_status").notNull(),
    fulfillmentStatus: fulfillmentStatusEnum("fulfillment_status").notNull(),
    currency: text("currency").default("SAR").notNull(),
    subtotalMinor: bigint("subtotal_minor", { mode: "number" }).notNull(),
    discountMinor: bigint("discount_minor", { mode: "number" }).default(0).notNull(),
    shippingMinor: bigint("shipping_minor", { mode: "number" }).default(0).notNull(),
    taxMinor: bigint("tax_minor", { mode: "number" }).default(0).notNull(),
    totalMinor: bigint("total_minor", { mode: "number" }).notNull(),
    placedAt: timestamp("placed_at", { mode: "date", withTimezone: true }).notNull(),
    cancelledAt: timestamp("cancelled_at", { mode: "date", withTimezone: true }),
    sourceVersion: text("source_version"),
    sourceUpdatedAt: timestamp("source_updated_at", {
      mode: "date",
      withTimezone: true,
    }),
    metadata: jsonb("metadata").$type<JsonObject>().default(emptyJson).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    foreignKey({
      name: "orders_customer_fk",
      columns: [table.storeId, table.customerId],
      foreignColumns: [customers.storeId, customers.id],
    }).onDelete("restrict"),
    unique("orders_store_id_unique").on(table.storeId, table.id),
    uniqueIndex("orders_store_external_unique").on(table.storeId, table.externalId),
    index("orders_store_placed_idx").on(
      table.storeId,
      table.placedAt.desc(),
      table.id.desc(),
    ),
    index("orders_store_customer_placed_idx").on(
      table.storeId,
      table.customerId,
      table.placedAt.desc(),
    ),
    index("orders_store_status_placed_idx").on(
      table.storeId,
      table.status,
      table.placedAt.desc(),
    ),
    check("orders_amounts_nonnegative", sql`
      ${table.subtotalMinor} >= 0
      and ${table.discountMinor} >= 0
      and ${table.shippingMinor} >= 0
      and ${table.taxMinor} >= 0
      and ${table.totalMinor} >= 0
    `),
    check("orders_currency_iso_length", sql`char_length(${table.currency}) = 3`),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    orderId: uuid("order_id").notNull(),
    productId: uuid("product_id"),
    variantId: uuid("variant_id"),
    externalId: text("external_id").notNull(),
    title: text("title").notNull(),
    sku: text("sku"),
    quantity: integer("quantity").notNull(),
    currency: text("currency").default("SAR").notNull(),
    unitPriceMinor: bigint("unit_price_minor", { mode: "number" }).notNull(),
    discountMinor: bigint("discount_minor", { mode: "number" }).default(0).notNull(),
    taxMinor: bigint("tax_minor", { mode: "number" }).default(0).notNull(),
    totalMinor: bigint("total_minor", { mode: "number" }).notNull(),
    metadata: jsonb("metadata").$type<JsonObject>().default(emptyJson).notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    foreignKey({
      name: "order_items_order_fk",
      columns: [table.storeId, table.orderId],
      foreignColumns: [orders.storeId, orders.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "order_items_product_fk",
      columns: [table.storeId, table.productId],
      foreignColumns: [products.storeId, products.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "order_items_variant_fk",
      columns: [table.storeId, table.variantId],
      foreignColumns: [productVariants.storeId, productVariants.id],
    }).onDelete("restrict"),
    uniqueIndex("order_items_order_external_unique").on(table.orderId, table.externalId),
    index("order_items_store_order_idx").on(table.storeId, table.orderId),
    index("order_items_store_product_idx").on(table.storeId, table.productId),
    index("order_items_store_variant_idx").on(table.storeId, table.variantId),
    check("order_items_quantity_positive", sql`${table.quantity} > 0`),
    check("order_items_amounts_nonnegative", sql`
      ${table.unitPriceMinor} >= 0
      and ${table.discountMinor} >= 0
      and ${table.taxMinor} >= 0
      and ${table.totalMinor} >= 0
    `),
    check("order_items_currency_iso_length", sql`char_length(${table.currency}) = 3`),
  ],
);

export const carts = pgTable(
  "carts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    customerId: uuid("customer_id"),
    visitorId: uuid("visitor_id"),
    externalId: text("external_id").notNull(),
    status: cartStatusEnum("status").default("active").notNull(),
    currency: text("currency").default("SAR").notNull(),
    subtotalMinor: bigint("subtotal_minor", { mode: "number" }).default(0).notNull(),
    discountMinor: bigint("discount_minor", { mode: "number" }).default(0).notNull(),
    totalMinor: bigint("total_minor", { mode: "number" }).default(0).notNull(),
    checkoutUrl: text("checkout_url"),
    sourceUpdatedAt: timestamp("source_updated_at", {
      mode: "date",
      withTimezone: true,
    }),
    convertedOrderId: uuid("converted_order_id"),
    abandonedAt: timestamp("abandoned_at", { mode: "date", withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    foreignKey({
      name: "carts_customer_fk",
      columns: [table.storeId, table.customerId],
      foreignColumns: [customers.storeId, customers.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "carts_visitor_fk",
      columns: [table.storeId, table.visitorId],
      foreignColumns: [visitors.storeId, visitors.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "carts_converted_order_fk",
      columns: [table.storeId, table.convertedOrderId],
      foreignColumns: [orders.storeId, orders.id],
    }).onDelete("restrict"),
    unique("carts_store_id_unique").on(table.storeId, table.id),
    uniqueIndex("carts_store_external_unique").on(table.storeId, table.externalId),
    index("carts_store_status_updated_idx").on(
      table.storeId,
      table.status,
      table.updatedAt.desc(),
    ),
    index("carts_customer_idx").on(table.customerId),
    index("carts_visitor_idx").on(table.visitorId),
    index("carts_converted_order_idx").on(table.convertedOrderId),
    check("carts_amounts_nonnegative", sql`
      ${table.subtotalMinor} >= 0
      and ${table.discountMinor} >= 0
      and ${table.totalMinor} >= 0
    `),
    check("carts_currency_iso_length", sql`char_length(${table.currency}) = 3`),
  ],
);

export const cartItems = pgTable(
  "cart_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    cartId: uuid("cart_id").notNull(),
    productId: uuid("product_id").notNull(),
    variantId: uuid("variant_id"),
    quantity: integer("quantity").notNull(),
    currency: text("currency").default("SAR").notNull(),
    unitPriceMinor: bigint("unit_price_minor", { mode: "number" }).notNull(),
    totalMinor: bigint("total_minor", { mode: "number" }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    foreignKey({
      name: "cart_items_cart_fk",
      columns: [table.storeId, table.cartId],
      foreignColumns: [carts.storeId, carts.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "cart_items_product_fk",
      columns: [table.storeId, table.productId],
      foreignColumns: [products.storeId, products.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "cart_items_variant_fk",
      columns: [table.storeId, table.variantId],
      foreignColumns: [productVariants.storeId, productVariants.id],
    }).onDelete("restrict"),
    unique("cart_items_cart_product_variant_unique")
      .on(table.cartId, table.productId, table.variantId)
      .nullsNotDistinct(),
    index("cart_items_store_product_idx").on(table.storeId, table.productId),
    index("cart_items_variant_idx").on(table.variantId),
    check("cart_items_quantity_positive", sql`${table.quantity} > 0`),
    check(
      "cart_items_amounts_nonnegative",
      sql`${table.unitPriceMinor} >= 0 and ${table.totalMinor} >= 0`,
    ),
    check("cart_items_currency_iso_length", sql`char_length(${table.currency}) = 3`),
  ],
);

export const attributionRules = pgTable(
  "attribution_rules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    name: text("name").notNull(),
    directWindowHours: integer("direct_window_hours").default(24).notNull(),
    influencedWindowHours: integer("influenced_window_hours").default(168).notNull(),
    active: boolean("active").default(true).notNull(),
    effectiveFrom: timestamp("effective_from", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    effectiveUntil: timestamp("effective_until", {
      mode: "date",
      withTimezone: true,
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    unique("attribution_rules_store_id_unique").on(table.storeId, table.id),
    uniqueIndex("attribution_rules_store_name_unique").on(table.storeId, table.name),
    index("attribution_rules_store_active_idx").on(table.storeId, table.active),
    check(
      "attribution_rules_windows_positive",
      sql`${table.directWindowHours} > 0 and ${table.influencedWindowHours} >= ${table.directWindowHours}`,
    ),
  ],
);

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    widgetSessionId: uuid("widget_session_id"),
    visitorId: uuid("visitor_id"),
    customerId: uuid("customer_id"),
    status: conversationStatusEnum("status").default("active").notNull(),
    locale: localeEnum("locale").default("ar").notNull(),
    channel: text("channel").default("widget").notNull(),
    summary: text("summary"),
    outcome: text("outcome"),
    startedAt: timestamp("started_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    endedAt: timestamp("ended_at", { mode: "date", withTimezone: true }),
    lastMessageAt: timestamp("last_message_at", {
      mode: "date",
      withTimezone: true,
    }),
    retentionExpiresAt: timestamp("retention_expires_at", {
      mode: "date",
      withTimezone: true,
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    foreignKey({
      name: "conversations_widget_session_fk",
      columns: [table.storeId, table.widgetSessionId],
      foreignColumns: [widgetSessions.storeId, widgetSessions.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "conversations_visitor_fk",
      columns: [table.storeId, table.visitorId],
      foreignColumns: [visitors.storeId, visitors.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "conversations_customer_fk",
      columns: [table.storeId, table.customerId],
      foreignColumns: [customers.storeId, customers.id],
    }).onDelete("restrict"),
    unique("conversations_store_id_unique").on(table.storeId, table.id),
    index("conversations_store_started_idx").on(
      table.storeId,
      table.startedAt.desc(),
      table.id.desc(),
    ),
    index("conversations_store_status_activity_idx").on(
      table.storeId,
      table.status,
      table.lastMessageAt.desc(),
    ),
    index("conversations_widget_session_idx").on(table.widgetSessionId),
    index("conversations_visitor_idx").on(table.visitorId),
    index("conversations_customer_idx").on(table.customerId),
  ],
);

/** Append-only conversation transcript rows. Corrections should be new messages. */
export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    conversationId: uuid("conversation_id").notNull(),
    sequence: integer("sequence").notNull(),
    clientMessageId: text("client_message_id"),
    role: messageRoleEnum("role").notNull(),
    content: text("content").notNull(),
    locale: localeEnum("locale"),
    model: text("model"),
    promptTokens: integer("prompt_tokens"),
    completionTokens: integer("completion_tokens"),
    latencyMs: integer("latency_ms"),
    grounded: boolean("grounded"),
    failedReason: text("failed_reason"),
    metadata: jsonb("metadata").$type<JsonObject>().default(emptyJson).notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    foreignKey({
      name: "messages_conversation_fk",
      columns: [table.storeId, table.conversationId],
      foreignColumns: [conversations.storeId, conversations.id],
    }).onDelete("restrict"),
    unique("messages_store_id_unique").on(table.storeId, table.id),
    uniqueIndex("messages_conversation_sequence_unique").on(
      table.conversationId,
      table.sequence,
    ),
    uniqueIndex("messages_conversation_client_id_unique")
      .on(table.conversationId, table.clientMessageId)
      .where(sql`${table.clientMessageId} is not null`),
    index("messages_store_created_idx").on(
      table.storeId,
      table.createdAt.desc(),
      table.id.desc(),
    ),
    check("messages_sequence_positive", sql`${table.sequence} > 0`),
    check("messages_tokens_nonnegative", sql`
      (${table.promptTokens} is null or ${table.promptTokens} >= 0)
      and (${table.completionTokens} is null or ${table.completionTokens} >= 0)
      and (${table.latencyMs} is null or ${table.latencyMs} >= 0)
    `),
  ],
);

export const conversationSignals = pgTable(
  "conversation_signals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    conversationId: uuid("conversation_id").notNull(),
    messageId: uuid("message_id"),
    signalType: text("signal_type").notNull(),
    value: text("value").notNull(),
    normalizedValue: text("normalized_value"),
    confidenceBps: integer("confidence_bps"),
    extractionModel: text("extraction_model"),
    evidence: jsonb("evidence").$type<JsonObject>().default(emptyJson).notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    foreignKey({
      name: "conversation_signals_conversation_fk",
      columns: [table.storeId, table.conversationId],
      foreignColumns: [conversations.storeId, conversations.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "conversation_signals_message_fk",
      columns: [table.storeId, table.messageId],
      foreignColumns: [messages.storeId, messages.id],
    }).onDelete("restrict"),
    index("conversation_signals_store_type_created_idx").on(
      table.storeId,
      table.signalType,
      table.createdAt.desc(),
    ),
    index("conversation_signals_conversation_idx").on(table.conversationId),
    index("conversation_signals_message_idx").on(table.messageId),
    check(
      "conversation_signals_confidence_range",
      sql`${table.confidenceBps} is null or ${table.confidenceBps} between 0 and 10000`,
    ),
  ],
);

export const recommendations = pgTable(
  "recommendations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    conversationId: uuid("conversation_id").notNull(),
    messageId: uuid("message_id"),
    status: recommendationStatusEnum("status").default("generated").notNull(),
    algorithmVersion: text("algorithm_version").notNull(),
    retrievalQuery: text("retrieval_query"),
    customerConstraints: jsonb("customer_constraints")
      .$type<JsonObject>()
      .default(emptyJson)
      .notNull(),
    explanation: text("explanation"),
    failureReason: text("failure_reason"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    foreignKey({
      name: "recommendations_conversation_fk",
      columns: [table.storeId, table.conversationId],
      foreignColumns: [conversations.storeId, conversations.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "recommendations_message_fk",
      columns: [table.storeId, table.messageId],
      foreignColumns: [messages.storeId, messages.id],
    }).onDelete("restrict"),
    unique("recommendations_store_id_unique").on(table.storeId, table.id),
    index("recommendations_store_created_idx").on(
      table.storeId,
      table.createdAt.desc(),
      table.id.desc(),
    ),
    index("recommendations_conversation_idx").on(table.conversationId),
    index("recommendations_message_idx").on(table.messageId),
  ],
);

export const recommendationItems = pgTable(
  "recommendation_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    recommendationId: uuid("recommendation_id").notNull(),
    productId: uuid("product_id").notNull(),
    variantId: uuid("variant_id"),
    rank: integer("rank").notNull(),
    suitabilityBps: integer("suitability_bps").notNull(),
    relevanceBps: integer("relevance_bps"),
    priceFitBps: integer("price_fit_bps"),
    availabilityVerifiedAt: timestamp("availability_verified_at", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    priceMinorSnapshot: bigint("price_minor_snapshot", { mode: "number" }).notNull(),
    currency: text("currency").default("SAR").notNull(),
    explanation: text("explanation"),
    evidence: jsonb("evidence").$type<JsonObject>().default(emptyJson).notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    foreignKey({
      name: "recommendation_items_recommendation_fk",
      columns: [table.storeId, table.recommendationId],
      foreignColumns: [recommendations.storeId, recommendations.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "recommendation_items_product_fk",
      columns: [table.storeId, table.productId],
      foreignColumns: [products.storeId, products.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "recommendation_items_variant_fk",
      columns: [table.storeId, table.variantId],
      foreignColumns: [productVariants.storeId, productVariants.id],
    }).onDelete("restrict"),
    unique("recommendation_items_store_id_unique").on(table.storeId, table.id),
    uniqueIndex("recommendation_items_recommendation_rank_unique").on(
      table.recommendationId,
      table.rank,
    ),
    index("recommendation_items_product_created_idx").on(
      table.productId,
      table.createdAt.desc(),
    ),
    index("recommendation_items_variant_idx").on(table.variantId),
    check("recommendation_items_rank_positive", sql`${table.rank} > 0`),
    check("recommendation_items_scores_range", sql`
      ${table.suitabilityBps} between 0 and 10000
      and (${table.relevanceBps} is null or ${table.relevanceBps} between 0 and 10000)
      and (${table.priceFitBps} is null or ${table.priceFitBps} between 0 and 10000)
    `),
    check(
      "recommendation_items_price_nonnegative",
      sql`${table.priceMinorSnapshot} >= 0`,
    ),
    check(
      "recommendation_items_currency_iso_length",
      sql`char_length(${table.currency}) = 3`,
    ),
  ],
);

/** Append-only recommendation funnel facts. Never update or delete for corrections. */
export const recommendationEvents = pgTable(
  "recommendation_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    recommendationId: uuid("recommendation_id").notNull(),
    recommendationItemId: uuid("recommendation_item_id"),
    conversationId: uuid("conversation_id").notNull(),
    widgetSessionId: uuid("widget_session_id"),
    productId: uuid("product_id"),
    eventName: eventNameEnum("event_name").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    source: text("source").default("widget").notNull(),
    consentState: consentStateEnum("consent_state").default("unknown").notNull(),
    occurredAt: timestamp("occurred_at", { mode: "date", withTimezone: true }).notNull(),
    metadata: jsonb("metadata").$type<JsonObject>().default(emptyJson).notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    foreignKey({
      name: "recommendation_events_recommendation_fk",
      columns: [table.storeId, table.recommendationId],
      foreignColumns: [recommendations.storeId, recommendations.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "recommendation_events_item_fk",
      columns: [table.storeId, table.recommendationItemId],
      foreignColumns: [recommendationItems.storeId, recommendationItems.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "recommendation_events_conversation_fk",
      columns: [table.storeId, table.conversationId],
      foreignColumns: [conversations.storeId, conversations.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "recommendation_events_session_fk",
      columns: [table.storeId, table.widgetSessionId],
      foreignColumns: [widgetSessions.storeId, widgetSessions.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "recommendation_events_product_fk",
      columns: [table.storeId, table.productId],
      foreignColumns: [products.storeId, products.id],
    }).onDelete("restrict"),
    uniqueIndex("recommendation_events_store_idempotency_unique").on(
      table.storeId,
      table.idempotencyKey,
    ),
    index("recommendation_events_store_name_occurred_idx").on(
      table.storeId,
      table.eventName,
      table.occurredAt.desc(),
      table.id.desc(),
    ),
    index("recommendation_events_recommendation_idx").on(table.recommendationId),
    index("recommendation_events_item_idx").on(table.recommendationItemId),
    index("recommendation_events_conversation_idx").on(table.conversationId),
    index("recommendation_events_session_idx").on(table.widgetSessionId),
    index("recommendation_events_product_idx").on(table.productId),
  ],
);

/** Append-only canonical commerce and widget event ledger. */
export const commerceEvents = pgTable(
  "commerce_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    eventName: eventNameEnum("event_name").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    source: text("source").notNull(),
    widgetSessionId: uuid("widget_session_id"),
    conversationId: uuid("conversation_id"),
    visitorId: uuid("visitor_id"),
    customerId: uuid("customer_id"),
    productId: uuid("product_id"),
    variantId: uuid("variant_id"),
    orderId: uuid("order_id"),
    cartId: uuid("cart_id"),
    consentState: consentStateEnum("consent_state").default("unknown").notNull(),
    occurredAt: timestamp("occurred_at", { mode: "date", withTimezone: true }).notNull(),
    metadata: jsonb("metadata").$type<JsonObject>().default(emptyJson).notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    foreignKey({
      name: "commerce_events_session_fk",
      columns: [table.storeId, table.widgetSessionId],
      foreignColumns: [widgetSessions.storeId, widgetSessions.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "commerce_events_conversation_fk",
      columns: [table.storeId, table.conversationId],
      foreignColumns: [conversations.storeId, conversations.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "commerce_events_visitor_fk",
      columns: [table.storeId, table.visitorId],
      foreignColumns: [visitors.storeId, visitors.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "commerce_events_customer_fk",
      columns: [table.storeId, table.customerId],
      foreignColumns: [customers.storeId, customers.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "commerce_events_product_fk",
      columns: [table.storeId, table.productId],
      foreignColumns: [products.storeId, products.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "commerce_events_variant_fk",
      columns: [table.storeId, table.variantId],
      foreignColumns: [productVariants.storeId, productVariants.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "commerce_events_order_fk",
      columns: [table.storeId, table.orderId],
      foreignColumns: [orders.storeId, orders.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "commerce_events_cart_fk",
      columns: [table.storeId, table.cartId],
      foreignColumns: [carts.storeId, carts.id],
    }).onDelete("restrict"),
    uniqueIndex("commerce_events_store_idempotency_unique").on(
      table.storeId,
      table.idempotencyKey,
    ),
    index("commerce_events_store_name_occurred_idx").on(
      table.storeId,
      table.eventName,
      table.occurredAt.desc(),
      table.id.desc(),
    ),
    index("commerce_events_session_idx").on(table.widgetSessionId),
    index("commerce_events_conversation_idx").on(table.conversationId),
    index("commerce_events_visitor_idx").on(table.visitorId),
    index("commerce_events_customer_idx").on(table.customerId),
    index("commerce_events_product_idx").on(table.productId),
    index("commerce_events_variant_idx").on(table.variantId),
    index("commerce_events_order_idx").on(table.orderId),
    index("commerce_events_cart_idx").on(table.cartId),
  ],
);

export const orderAttributions = pgTable(
  "order_attributions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    orderId: uuid("order_id").notNull(),
    conversationId: uuid("conversation_id").notNull(),
    attributionRuleId: uuid("attribution_rule_id").notNull(),
    type: attributionTypeEnum("type").notNull(),
    attributedRevenueMinor: bigint("attributed_revenue_minor", { mode: "number" }).notNull(),
    currency: text("currency").default("SAR").notNull(),
    confidenceBps: integer("confidence_bps").notNull(),
    evidence: jsonb("evidence").$type<JsonObject>().default(emptyJson).notNull(),
    attributedAt: timestamp("attributed_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    foreignKey({
      name: "order_attributions_order_fk",
      columns: [table.storeId, table.orderId],
      foreignColumns: [orders.storeId, orders.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "order_attributions_conversation_fk",
      columns: [table.storeId, table.conversationId],
      foreignColumns: [conversations.storeId, conversations.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "order_attributions_rule_fk",
      columns: [table.storeId, table.attributionRuleId],
      foreignColumns: [attributionRules.storeId, attributionRules.id],
    }).onDelete("restrict"),
    uniqueIndex("order_attributions_order_conversation_type_unique").on(
      table.orderId,
      table.conversationId,
      table.type,
    ),
    index("order_attributions_store_type_date_idx").on(
      table.storeId,
      table.type,
      table.attributedAt.desc(),
    ),
    index("order_attributions_conversation_idx").on(table.conversationId),
    index("order_attributions_rule_idx").on(table.attributionRuleId),
    check(
      "order_attributions_revenue_nonnegative",
      sql`${table.attributedRevenueMinor} >= 0`,
    ),
    check(
      "order_attributions_confidence_range",
      sql`${table.confidenceBps} between 0 and 10000`,
    ),
    check(
      "order_attributions_currency_iso_length",
      sql`char_length(${table.currency}) = 3`,
    ),
  ],
);

/** Rebuildable daily aggregate derived from append-only ledgers. */
export const dailyStoreMetrics = pgTable(
  "daily_store_metrics",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    metricDate: date("metric_date", { mode: "string" }).notNull(),
    timezone: text("timezone").notNull(),
    conversations: bigint("conversations", { mode: "number" }).default(0).notNull(),
    uniqueVisitors: bigint("unique_visitors", { mode: "number" }).default(0).notNull(),
    recommendations: bigint("recommendations", { mode: "number" }).default(0).notNull(),
    recommendationClicks: bigint("recommendation_clicks", { mode: "number" })
      .default(0)
      .notNull(),
    addToCarts: bigint("add_to_carts", { mode: "number" }).default(0).notNull(),
    checkouts: bigint("checkouts", { mode: "number" }).default(0).notNull(),
    purchases: bigint("purchases", { mode: "number" }).default(0).notNull(),
    directRevenueMinor: bigint("direct_revenue_minor", { mode: "number" })
      .default(0)
      .notNull(),
    influencedRevenueMinor: bigint("influenced_revenue_minor", { mode: "number" })
      .default(0)
      .notNull(),
    currency: text("currency").default("SAR").notNull(),
    computedAt: timestamp("computed_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    sourceWatermark: timestamp("source_watermark", {
      mode: "date",
      withTimezone: true,
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("daily_store_metrics_store_date_unique").on(
      table.storeId,
      table.metricDate,
    ),
    index("daily_store_metrics_store_date_idx").on(
      table.storeId,
      table.metricDate.desc(),
    ),
    check("daily_store_metrics_counts_nonnegative", sql`
      ${table.conversations} >= 0
      and ${table.uniqueVisitors} >= 0
      and ${table.recommendations} >= 0
      and ${table.recommendationClicks} >= 0
      and ${table.addToCarts} >= 0
      and ${table.checkouts} >= 0
      and ${table.purchases} >= 0
      and ${table.directRevenueMinor} >= 0
      and ${table.influencedRevenueMinor} >= 0
    `),
    check("daily_store_metrics_currency_length", sql`char_length(${table.currency}) = 3`),
  ],
);

/** Rebuildable per-product daily aggregate derived from append-only ledgers. */
export const dailyProductMetrics = pgTable(
  "daily_product_metrics",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    productId: uuid("product_id").notNull(),
    metricDate: date("metric_date", { mode: "string" }).notNull(),
    recommendationImpressions: bigint("recommendation_impressions", { mode: "number" })
      .default(0)
      .notNull(),
    recommendationClicks: bigint("recommendation_clicks", { mode: "number" })
      .default(0)
      .notNull(),
    addToCarts: bigint("add_to_carts", { mode: "number" }).default(0).notNull(),
    purchases: bigint("purchases", { mode: "number" }).default(0).notNull(),
    unitsSold: bigint("units_sold", { mode: "number" }).default(0).notNull(),
    directRevenueMinor: bigint("direct_revenue_minor", { mode: "number" })
      .default(0)
      .notNull(),
    influencedRevenueMinor: bigint("influenced_revenue_minor", { mode: "number" })
      .default(0)
      .notNull(),
    currency: text("currency").default("SAR").notNull(),
    computedAt: timestamp("computed_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    foreignKey({
      name: "daily_product_metrics_product_fk",
      columns: [table.storeId, table.productId],
      foreignColumns: [products.storeId, products.id],
    }).onDelete("restrict"),
    uniqueIndex("daily_product_metrics_product_date_unique").on(
      table.productId,
      table.metricDate,
    ),
    index("daily_product_metrics_store_date_idx").on(
      table.storeId,
      table.metricDate.desc(),
    ),
    check("daily_product_metrics_counts_nonnegative", sql`
      ${table.recommendationImpressions} >= 0
      and ${table.recommendationClicks} >= 0
      and ${table.addToCarts} >= 0
      and ${table.purchases} >= 0
      and ${table.unitsSold} >= 0
      and ${table.directRevenueMinor} >= 0
      and ${table.influencedRevenueMinor} >= 0
    `),
    check("daily_product_metrics_currency_length", sql`char_length(${table.currency}) = 3`),
  ],
);

export const humanHandoffs = pgTable(
  "human_handoffs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    conversationId: uuid("conversation_id").notNull(),
    assignedStoreMemberId: uuid("assigned_store_member_id"),
    status: handoffStatusEnum("status").default("open").notNull(),
    priority: priorityEnum("priority").default("medium").notNull(),
    reason: text("reason").notNull(),
    summary: text("summary").notNull(),
    suggestedResponse: text("suggested_response"),
    contactEncrypted: text("contact_encrypted"),
    contactConsent: boolean("contact_consent").default(false).notNull(),
    resolvedAt: timestamp("resolved_at", { mode: "date", withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    foreignKey({
      name: "human_handoffs_conversation_fk",
      columns: [table.storeId, table.conversationId],
      foreignColumns: [conversations.storeId, conversations.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "human_handoffs_assignee_fk",
      columns: [table.storeId, table.assignedStoreMemberId],
      foreignColumns: [storeMembers.storeId, storeMembers.id],
    }).onDelete("restrict"),
    unique("human_handoffs_store_id_unique").on(table.storeId, table.id),
    index("human_handoffs_store_open_priority_idx")
      .on(table.storeId, table.priority, table.createdAt.desc())
      .where(sql`${table.status} in ('open', 'assigned')`),
    index("human_handoffs_conversation_idx").on(table.conversationId),
    index("human_handoffs_assignee_idx").on(table.assignedStoreMemberId),
  ],
);

/** Append-only safety classifier and response-validator interventions. */
export const safetyInterventions = pgTable(
  "safety_interventions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    conversationId: uuid("conversation_id").notNull(),
    messageId: uuid("message_id"),
    stage: text("stage").notNull(),
    category: text("category").notNull(),
    policyCode: text("policy_code").notNull(),
    action: text("action").notNull(),
    confidenceBps: integer("confidence_bps"),
    inputHash: text("input_hash").notNull(),
    details: jsonb("details").$type<JsonObject>().default(emptyJson).notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    foreignKey({
      name: "safety_interventions_conversation_fk",
      columns: [table.storeId, table.conversationId],
      foreignColumns: [conversations.storeId, conversations.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "safety_interventions_message_fk",
      columns: [table.storeId, table.messageId],
      foreignColumns: [messages.storeId, messages.id],
    }).onDelete("restrict"),
    index("safety_interventions_store_category_created_idx").on(
      table.storeId,
      table.category,
      table.createdAt.desc(),
    ),
    index("safety_interventions_conversation_idx").on(table.conversationId),
    index("safety_interventions_message_idx").on(table.messageId),
    check(
      "safety_interventions_confidence_range",
      sql`${table.confidenceBps} is null or ${table.confidenceBps} between 0 and 10000`,
    ),
  ],
);

export const storePages = pgTable(
  "store_pages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    externalId: text("external_id"),
    pageType: text("page_type").notNull(),
    url: text("url").notNull(),
    canonicalUrl: text("canonical_url"),
    locale: localeEnum("locale"),
    title: text("title"),
    content: text("content"),
    indexable: boolean("indexable"),
    sourceVersion: text("source_version"),
    sourceUpdatedAt: timestamp("source_updated_at", {
      mode: "date",
      withTimezone: true,
    }),
    sourceDeletedAt: timestamp("source_deleted_at", {
      mode: "date",
      withTimezone: true,
    }),
    metadata: jsonb("metadata").$type<JsonObject>().default(emptyJson).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    unique("store_pages_store_id_unique").on(table.storeId, table.id),
    uniqueIndex("store_pages_store_url_unique").on(table.storeId, table.url),
    uniqueIndex("store_pages_store_external_unique")
      .on(table.storeId, table.externalId)
      .where(sql`${table.externalId} is not null`),
    index("store_pages_store_type_idx").on(table.storeId, table.pageType),
  ],
);

export const merchantThreads = pgTable(
  "merchant_threads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    createdByStoreMemberId: uuid("created_by_store_member_id").notNull(),
    title: text("title"),
    status: text("status").default("active").notNull(),
    dateRangeStart: timestamp("date_range_start", {
      mode: "date",
      withTimezone: true,
    }),
    dateRangeEnd: timestamp("date_range_end", {
      mode: "date",
      withTimezone: true,
    }),
    archivedAt: timestamp("archived_at", { mode: "date", withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    foreignKey({
      name: "merchant_threads_creator_fk",
      columns: [table.storeId, table.createdByStoreMemberId],
      foreignColumns: [storeMembers.storeId, storeMembers.id],
    }).onDelete("restrict"),
    unique("merchant_threads_store_id_unique").on(table.storeId, table.id),
    index("merchant_threads_store_updated_idx").on(
      table.storeId,
      table.updatedAt.desc(),
      table.id.desc(),
    ),
    index("merchant_threads_creator_idx").on(table.createdByStoreMemberId),
    check(
      "merchant_threads_date_range_valid",
      sql`${table.dateRangeStart} is null or ${table.dateRangeEnd} is null or ${table.dateRangeEnd} >= ${table.dateRangeStart}`,
    ),
  ],
);

/** Append-only merchant assistant transcript rows. */
export const merchantMessages = pgTable(
  "merchant_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    threadId: uuid("thread_id").notNull(),
    authorStoreMemberId: uuid("author_store_member_id"),
    sequence: integer("sequence").notNull(),
    clientMessageId: text("client_message_id"),
    role: messageRoleEnum("role").notNull(),
    content: text("content").notNull(),
    observationVsInference: insightKindEnum("observation_vs_inference"),
    confidenceBps: integer("confidence_bps"),
    evidence: jsonb("evidence").$type<JsonObject>().default(emptyJson).notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    foreignKey({
      name: "merchant_messages_thread_fk",
      columns: [table.storeId, table.threadId],
      foreignColumns: [merchantThreads.storeId, merchantThreads.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "merchant_messages_author_fk",
      columns: [table.storeId, table.authorStoreMemberId],
      foreignColumns: [storeMembers.storeId, storeMembers.id],
    }).onDelete("restrict"),
    unique("merchant_messages_store_id_unique").on(table.storeId, table.id),
    uniqueIndex("merchant_messages_thread_sequence_unique").on(
      table.threadId,
      table.sequence,
    ),
    uniqueIndex("merchant_messages_thread_client_id_unique")
      .on(table.threadId, table.clientMessageId)
      .where(sql`${table.clientMessageId} is not null`),
    index("merchant_messages_author_idx").on(table.authorStoreMemberId),
    check("merchant_messages_sequence_positive", sql`${table.sequence} > 0`),
    check(
      "merchant_messages_confidence_range",
      sql`${table.confidenceBps} is null or ${table.confidenceBps} between 0 and 10000`,
    ),
  ],
);

export const merchantToolRuns = pgTable(
  "merchant_tool_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    threadId: uuid("thread_id").notNull(),
    merchantMessageId: uuid("merchant_message_id"),
    toolName: text("tool_name").notNull(),
    status: jobStatusEnum("status").default("queued").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    input: jsonb("input").$type<JsonObject>().notNull(),
    output: jsonb("output").$type<JsonValue>(),
    sourceLinks: jsonb("source_links").$type<JsonValue[]>().default(sql`'[]'::jsonb`).notNull(),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    startedAt: timestamp("started_at", { mode: "date", withTimezone: true }),
    finishedAt: timestamp("finished_at", { mode: "date", withTimezone: true }),
    latencyMs: integer("latency_ms"),
    createdAt: createdAt(),
  },
  (table) => [
    foreignKey({
      name: "merchant_tool_runs_thread_fk",
      columns: [table.storeId, table.threadId],
      foreignColumns: [merchantThreads.storeId, merchantThreads.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "merchant_tool_runs_message_fk",
      columns: [table.storeId, table.merchantMessageId],
      foreignColumns: [merchantMessages.storeId, merchantMessages.id],
    }).onDelete("restrict"),
    uniqueIndex("merchant_tool_runs_store_idempotency_unique").on(
      table.storeId,
      table.idempotencyKey,
    ),
    index("merchant_tool_runs_thread_created_idx").on(
      table.threadId,
      table.createdAt.desc(),
    ),
    index("merchant_tool_runs_message_idx").on(table.merchantMessageId),
    index("merchant_tool_runs_store_tool_status_idx").on(
      table.storeId,
      table.toolName,
      table.status,
    ),
    check(
      "merchant_tool_runs_latency_nonnegative",
      sql`${table.latencyMs} is null or ${table.latencyMs} >= 0`,
    ),
  ],
);

export const merchantInsights = pgTable(
  "merchant_insights",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    threadId: uuid("thread_id"),
    merchantMessageId: uuid("merchant_message_id"),
    kind: insightKindEnum("kind").notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    dateRangeStart: timestamp("date_range_start", {
      mode: "date",
      withTimezone: true,
    }),
    dateRangeEnd: timestamp("date_range_end", {
      mode: "date",
      withTimezone: true,
    }),
    confidenceBps: integer("confidence_bps"),
    evidence: jsonb("evidence").$type<JsonObject>().notNull(),
    savedByStoreMemberId: uuid("saved_by_store_member_id"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    foreignKey({
      name: "merchant_insights_thread_fk",
      columns: [table.storeId, table.threadId],
      foreignColumns: [merchantThreads.storeId, merchantThreads.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "merchant_insights_message_fk",
      columns: [table.storeId, table.merchantMessageId],
      foreignColumns: [merchantMessages.storeId, merchantMessages.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "merchant_insights_saver_fk",
      columns: [table.storeId, table.savedByStoreMemberId],
      foreignColumns: [storeMembers.storeId, storeMembers.id],
    }).onDelete("restrict"),
    unique("merchant_insights_store_id_unique").on(table.storeId, table.id),
    index("merchant_insights_store_kind_created_idx").on(
      table.storeId,
      table.kind,
      table.createdAt.desc(),
    ),
    index("merchant_insights_thread_idx").on(table.threadId),
    index("merchant_insights_message_idx").on(table.merchantMessageId),
    index("merchant_insights_saver_idx").on(table.savedByStoreMemberId),
    check(
      "merchant_insights_confidence_range",
      sql`${table.confidenceBps} is null or ${table.confidenceBps} between 0 and 10000`,
    ),
    check(
      "merchant_insights_date_range_valid",
      sql`${table.dateRangeStart} is null or ${table.dateRangeEnd} is null or ${table.dateRangeEnd} >= ${table.dateRangeStart}`,
    ),
  ],
);

export const opportunities = pgTable(
  "opportunities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    insightId: uuid("insight_id"),
    type: text("type").notNull(),
    status: opportunityStatusEnum("status").default("open").notNull(),
    priority: priorityEnum("priority").default("medium").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    proposedAction: text("proposed_action").notNull(),
    confidenceBps: integer("confidence_bps").notNull(),
    estimatedImpact: jsonb("estimated_impact").$type<JsonObject>(),
    evidence: jsonb("evidence").$type<JsonObject>().notNull(),
    assignedStoreMemberId: uuid("assigned_store_member_id"),
    dueAt: timestamp("due_at", { mode: "date", withTimezone: true }),
    dismissedReason: text("dismissed_reason"),
    completedAt: timestamp("completed_at", { mode: "date", withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    foreignKey({
      name: "opportunities_insight_fk",
      columns: [table.storeId, table.insightId],
      foreignColumns: [merchantInsights.storeId, merchantInsights.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "opportunities_assignee_fk",
      columns: [table.storeId, table.assignedStoreMemberId],
      foreignColumns: [storeMembers.storeId, storeMembers.id],
    }).onDelete("restrict"),
    unique("opportunities_store_id_unique").on(table.storeId, table.id),
    index("opportunities_store_status_priority_idx").on(
      table.storeId,
      table.status,
      table.priority,
      table.createdAt.desc(),
    ),
    index("opportunities_insight_idx").on(table.insightId),
    index("opportunities_assignee_idx").on(table.assignedStoreMemberId),
    check(
      "opportunities_confidence_range",
      sql`${table.confidenceBps} between 0 and 10000`,
    ),
  ],
);

export const opportunityTargets = pgTable(
  "opportunity_targets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    opportunityId: uuid("opportunity_id").notNull(),
    productId: uuid("product_id"),
    pageId: uuid("page_id"),
    targetType: text("target_type").notNull(),
    targetReference: text("target_reference"),
    createdAt: createdAt(),
  },
  (table) => [
    foreignKey({
      name: "opportunity_targets_opportunity_fk",
      columns: [table.storeId, table.opportunityId],
      foreignColumns: [opportunities.storeId, opportunities.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "opportunity_targets_product_fk",
      columns: [table.storeId, table.productId],
      foreignColumns: [products.storeId, products.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "opportunity_targets_page_fk",
      columns: [table.storeId, table.pageId],
      foreignColumns: [storePages.storeId, storePages.id],
    }).onDelete("restrict"),
    index("opportunity_targets_opportunity_idx").on(table.opportunityId),
    index("opportunity_targets_product_idx").on(table.productId),
    index("opportunity_targets_page_idx").on(table.pageId),
    index("opportunity_targets_store_id_idx").on(table.storeId),
    check(
      "opportunity_targets_has_reference",
      sql`${table.productId} is not null or ${table.pageId} is not null or ${table.targetReference} is not null`,
    ),
  ],
);

export const contentDrafts = pgTable(
  "content_drafts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    opportunityId: uuid("opportunity_id"),
    productId: uuid("product_id"),
    pageId: uuid("page_id"),
    type: contentTypeEnum("type").notNull(),
    status: draftStatusEnum("status").default("draft").notNull(),
    title: text("title").notNull(),
    targetType: text("target_type").notNull(),
    targetReference: text("target_reference"),
    highRisk: boolean("high_risk").default(false).notNull(),
    generatedByModel: text("generated_by_model"),
    generatedFromEvidence: jsonb("generated_from_evidence")
      .$type<JsonObject>()
      .default(emptyJson)
      .notNull(),
    createdByStoreMemberId: uuid("created_by_store_member_id"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    foreignKey({
      name: "content_drafts_opportunity_fk",
      columns: [table.storeId, table.opportunityId],
      foreignColumns: [opportunities.storeId, opportunities.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "content_drafts_product_fk",
      columns: [table.storeId, table.productId],
      foreignColumns: [products.storeId, products.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "content_drafts_page_fk",
      columns: [table.storeId, table.pageId],
      foreignColumns: [storePages.storeId, storePages.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "content_drafts_creator_fk",
      columns: [table.storeId, table.createdByStoreMemberId],
      foreignColumns: [storeMembers.storeId, storeMembers.id],
    }).onDelete("restrict"),
    unique("content_drafts_store_id_unique").on(table.storeId, table.id),
    index("content_drafts_store_status_updated_idx").on(
      table.storeId,
      table.status,
      table.updatedAt.desc(),
    ),
    index("content_drafts_opportunity_idx").on(table.opportunityId),
    index("content_drafts_product_idx").on(table.productId),
    index("content_drafts_page_idx").on(table.pageId),
    index("content_drafts_creator_idx").on(table.createdByStoreMemberId),
  ],
);

export const contentVersions = pgTable(
  "content_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    draftId: uuid("draft_id").notNull(),
    version: integer("version").notNull(),
    content: jsonb("content").$type<JsonObject>().notNull(),
    checksumSha256: text("checksum_sha256").notNull(),
    changeSummary: text("change_summary"),
    createdByStoreMemberId: uuid("created_by_store_member_id"),
    createdAt: createdAt(),
  },
  (table) => [
    foreignKey({
      name: "content_versions_draft_fk",
      columns: [table.storeId, table.draftId],
      foreignColumns: [contentDrafts.storeId, contentDrafts.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "content_versions_creator_fk",
      columns: [table.storeId, table.createdByStoreMemberId],
      foreignColumns: [storeMembers.storeId, storeMembers.id],
    }).onDelete("restrict"),
    unique("content_versions_store_id_unique").on(table.storeId, table.id),
    uniqueIndex("content_versions_draft_version_unique").on(table.draftId, table.version),
    index("content_versions_creator_idx").on(table.createdByStoreMemberId),
    check("content_versions_version_positive", sql`${table.version} > 0`),
  ],
);

export const contentApprovals = pgTable(
  "content_approvals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    draftId: uuid("draft_id").notNull(),
    versionId: uuid("version_id").notNull(),
    decision: approvalDecisionEnum("decision").default("pending").notNull(),
    requestedByStoreMemberId: uuid("requested_by_store_member_id").notNull(),
    decidedByStoreMemberId: uuid("decided_by_store_member_id"),
    notes: text("notes"),
    requestedAt: timestamp("requested_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    decidedAt: timestamp("decided_at", { mode: "date", withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    foreignKey({
      name: "content_approvals_draft_fk",
      columns: [table.storeId, table.draftId],
      foreignColumns: [contentDrafts.storeId, contentDrafts.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "content_approvals_version_fk",
      columns: [table.storeId, table.versionId],
      foreignColumns: [contentVersions.storeId, contentVersions.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "content_approvals_requester_fk",
      columns: [table.storeId, table.requestedByStoreMemberId],
      foreignColumns: [storeMembers.storeId, storeMembers.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "content_approvals_decider_fk",
      columns: [table.storeId, table.decidedByStoreMemberId],
      foreignColumns: [storeMembers.storeId, storeMembers.id],
    }).onDelete("restrict"),
    unique("content_approvals_store_id_unique").on(table.storeId, table.id),
    uniqueIndex("content_approvals_draft_version_unique").on(
      table.draftId,
      table.versionId,
    ),
    index("content_approvals_store_pending_idx")
      .on(table.storeId, table.requestedAt.desc())
      .where(sql`${table.decision} = 'pending'`),
    index("content_approvals_requester_idx").on(table.requestedByStoreMemberId),
    index("content_approvals_decider_idx").on(table.decidedByStoreMemberId),
    check(
      "content_approvals_decision_timestamp_consistent",
      sql`(${table.decision} = 'pending' and ${table.decidedAt} is null) or (${table.decision} <> 'pending' and ${table.decidedAt} is not null)`,
    ),
  ],
);

export const publicationRuns = pgTable(
  "publication_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    draftId: uuid("draft_id").notNull(),
    versionId: uuid("version_id").notNull(),
    approvalId: uuid("approval_id").notNull(),
    connectionId: uuid("connection_id").notNull(),
    status: publicationStatusEnum("status").default("queued").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    expectedSourceVersion: text("expected_source_version"),
    publishedSourceVersion: text("published_source_version"),
    beforeSnapshot: jsonb("before_snapshot").$type<JsonObject>(),
    afterSnapshot: jsonb("after_snapshot").$type<JsonObject>(),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    startedAt: timestamp("started_at", { mode: "date", withTimezone: true }),
    finishedAt: timestamp("finished_at", { mode: "date", withTimezone: true }),
    createdAt: createdAt(),
  },
  (table) => [
    foreignKey({
      name: "publication_runs_draft_fk",
      columns: [table.storeId, table.draftId],
      foreignColumns: [contentDrafts.storeId, contentDrafts.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "publication_runs_version_fk",
      columns: [table.storeId, table.versionId],
      foreignColumns: [contentVersions.storeId, contentVersions.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "publication_runs_approval_fk",
      columns: [table.storeId, table.approvalId],
      foreignColumns: [contentApprovals.storeId, contentApprovals.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "publication_runs_connection_fk",
      columns: [table.storeId, table.connectionId],
      foreignColumns: [platformConnections.storeId, platformConnections.id],
    }).onDelete("restrict"),
    uniqueIndex("publication_runs_store_idempotency_unique").on(
      table.storeId,
      table.idempotencyKey,
    ),
    index("publication_runs_store_status_created_idx").on(
      table.storeId,
      table.status,
      table.createdAt.desc(),
    ),
    index("publication_runs_draft_idx").on(table.draftId),
    index("publication_runs_version_idx").on(table.versionId),
    index("publication_runs_approval_idx").on(table.approvalId),
    index("publication_runs_connection_idx").on(table.connectionId),
  ],
);

/** Append-only opportunity decision and workflow history. */
export const opportunityActions = pgTable(
  "opportunity_actions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    opportunityId: uuid("opportunity_id").notNull(),
    contentDraftId: uuid("content_draft_id"),
    actorStoreMemberId: uuid("actor_store_member_id"),
    action: text("action").notNull(),
    notes: text("notes"),
    metadata: jsonb("metadata").$type<JsonObject>().default(emptyJson).notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    foreignKey({
      name: "opportunity_actions_opportunity_fk",
      columns: [table.storeId, table.opportunityId],
      foreignColumns: [opportunities.storeId, opportunities.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "opportunity_actions_draft_fk",
      columns: [table.storeId, table.contentDraftId],
      foreignColumns: [contentDrafts.storeId, contentDrafts.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "opportunity_actions_actor_fk",
      columns: [table.storeId, table.actorStoreMemberId],
      foreignColumns: [storeMembers.storeId, storeMembers.id],
    }).onDelete("restrict"),
    index("opportunity_actions_opportunity_created_idx").on(
      table.opportunityId,
      table.createdAt.desc(),
    ),
    index("opportunity_actions_draft_idx").on(table.contentDraftId),
    index("opportunity_actions_actor_idx").on(table.actorStoreMemberId),
    index("opportunity_actions_store_id_idx").on(table.storeId),
  ],
);

/**
 * Service-only acquisition scans. These rows intentionally live outside the
 * store tenant model until an authenticated user claims a completed report.
 * RLS grants no browser role direct access; public routes expose DTOs by opaque
 * token after rate limiting and expiry checks.
 */
export const prospectScanRequests = pgTable(
  "prospect_scan_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tokenHash: text("token_hash").notNull(),
    normalizedUrl: text("normalized_url").notNull(),
    domain: text("domain").notNull(),
    locale: localeEnum("locale").default("ar").notNull(),
    countryCode: text("country_code").default("SA").notNull(),
    maxPages: integer("max_pages").default(10).notNull(),
    requestedIpHash: text("requested_ip_hash"),
    status: prospectScanStatusEnum("status").default("queued").notNull(),
    expiresAt: timestamp("expires_at", { mode: "date", withTimezone: true }).notNull(),
    claimedStoreId: uuid("claimed_store_id").references(() => stores.id, {
      onDelete: "restrict",
    }),
    claimedByUserId: uuid("claimed_by_user_id").references(() => users.id, {
      onDelete: "restrict",
    }),
    claimedAt: timestamp("claimed_at", { mode: "date", withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("prospect_scan_requests_token_hash_unique").on(table.tokenHash),
    index("prospect_scan_requests_domain_created_idx").on(table.domain, table.createdAt.desc()),
    index("prospect_scan_requests_status_expiry_idx").on(table.status, table.expiresAt),
    index("prospect_scan_requests_claimed_store_idx").on(table.claimedStoreId),
    check("prospect_scan_requests_country_length", sql`char_length(${table.countryCode}) = 2`),
    check("prospect_scan_requests_page_limit", sql`${table.maxPages} between 1 and 100`),
    check("prospect_scan_requests_expiry_after_creation", sql`${table.expiresAt} > ${table.createdAt}`),
    check(
      "prospect_scan_requests_claim_consistent",
      sql`num_nonnulls(${table.claimedStoreId}, ${table.claimedByUserId}, ${table.claimedAt}) in (0, 3)`,
    ),
  ],
);

export const prospectScanRuns = pgTable(
  "prospect_scan_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    requestId: uuid("request_id")
      .notNull()
      .references(() => prospectScanRequests.id, { onDelete: "cascade" }),
    status: prospectScanStatusEnum("status").default("queued").notNull(),
    progress: integer("progress").default(0).notNull(),
    currentStep: text("current_step").default("queued").notNull(),
    attemptId: uuid("attempt_id"),
    leaseExpiresAt: timestamp("lease_expires_at", { mode: "date", withTimezone: true }),
    methodologyVersion: text("methodology_version").notNull(),
    pagesDiscovered: integer("pages_discovered").default(0).notNull(),
    pagesScanned: integer("pages_scanned").default(0).notNull(),
    config: jsonb("config").$type<JsonObject>().default(emptyJson).notNull(),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    startedAt: timestamp("started_at", { mode: "date", withTimezone: true }),
    completedAt: timestamp("completed_at", { mode: "date", withTimezone: true }),
    createdAt: createdAt(),
  },
  (table) => [
    index("prospect_scan_runs_request_created_idx").on(table.requestId, table.createdAt.desc()),
    index("prospect_scan_runs_status_created_idx").on(table.status, table.createdAt),
    check("prospect_scan_runs_progress_range", sql`${table.progress} between 0 and 100`),
    check(
      "prospect_scan_runs_page_counts",
      sql`${table.pagesDiscovered} >= 0 and ${table.pagesScanned} >= 0 and ${table.pagesScanned} <= ${table.pagesDiscovered}`,
    ),
  ],
);

export const prospectScanPages = pgTable(
  "prospect_scan_pages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    runId: uuid("run_id")
      .notNull()
      .references(() => prospectScanRuns.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    canonicalUrl: text("canonical_url"),
    httpStatus: integer("http_status"),
    contentType: text("content_type"),
    title: text("title"),
    detectedLocale: text("detected_locale"),
    contentHash: text("content_hash"),
    bytesRead: integer("bytes_read").default(0).notNull(),
    durationMs: integer("duration_ms"),
    evidence: jsonb("evidence").$type<JsonObject>().default(emptyJson).notNull(),
    fetchedAt: timestamp("fetched_at", { mode: "date", withTimezone: true }),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex("prospect_scan_pages_run_url_unique").on(table.runId, table.url),
    index("prospect_scan_pages_run_status_idx").on(table.runId, table.httpStatus),
    check("prospect_scan_pages_bytes_nonnegative", sql`${table.bytesRead} >= 0`),
    check("prospect_scan_pages_duration_nonnegative", sql`${table.durationMs} is null or ${table.durationMs} >= 0`),
  ],
);

export const prospectScanEvidence = pgTable(
  "prospect_scan_evidence",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    runId: uuid("run_id")
      .notNull()
      .references(() => prospectScanRuns.id, { onDelete: "cascade" }),
    pageId: uuid("page_id").references(() => prospectScanPages.id, { onDelete: "cascade" }),
    category: text("category").notNull(),
    key: text("key").notNull(),
    status: text("status").notNull(),
    value: jsonb("value").$type<JsonValue>().notNull(),
    sourceUrl: text("source_url"),
    checksum: text("checksum"),
    capturedAt: timestamp("captured_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    index("prospect_scan_evidence_run_category_idx").on(table.runId, table.category),
    index("prospect_scan_evidence_page_idx").on(table.pageId),
    check(
      "prospect_scan_evidence_status_valid",
      sql`${table.status} in ('pass', 'warning', 'fail', 'unknown')`,
    ),
  ],
);

export const prospectScanFindings = pgTable(
  "prospect_scan_findings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    runId: uuid("run_id")
      .notNull()
      .references(() => prospectScanRuns.id, { onDelete: "cascade" }),
    pageId: uuid("page_id").references(() => prospectScanPages.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    category: text("category").notNull(),
    severity: priorityEnum("severity").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    evidence: jsonb("evidence").$type<JsonObject>().notNull(),
    recommendedFix: text("recommended_fix").notNull(),
    confidenceBps: integer("confidence_bps").notNull(),
    effort: text("effort").notNull(),
    suggestedOwner: text("suggested_owner").notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex("prospect_scan_findings_run_code_page_unique").on(
      table.runId,
      table.code,
      table.pageId,
    ),
    index("prospect_scan_findings_run_severity_idx").on(table.runId, table.severity),
    index("prospect_scan_findings_page_idx").on(table.pageId),
    check("prospect_scan_findings_confidence_range", sql`${table.confidenceBps} between 0 and 10000`),
    check("prospect_scan_findings_effort_valid", sql`${table.effort} in ('low', 'medium', 'high')`),
  ],
);

export const prospectReportSnapshots = pgTable(
  "prospect_report_snapshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    requestId: uuid("request_id")
      .notNull()
      .references(() => prospectScanRequests.id, { onDelete: "restrict" }),
    runId: uuid("run_id")
      .notNull()
      .references(() => prospectScanRuns.id, { onDelete: "restrict" }),
    shareTokenHash: text("share_token_hash").notNull(),
    accessLevel: reportAccessLevelEnum("access_level").default("preview").notNull(),
    overallScore: integer("overall_score").notNull(),
    coverageBps: integer("coverage_bps").notNull(),
    confidenceBps: integer("confidence_bps").notNull(),
    methodologyVersion: text("methodology_version").notNull(),
    components: jsonb("components").$type<JsonValue>().notNull(),
    executiveSummary: jsonb("executive_summary").$type<JsonObject>().notNull(),
    narrativeMarkdown: text("narrative_markdown"),
    modelId: text("model_id"),
    promptVersion: text("prompt_version"),
    generatedAt: timestamp("generated_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp("expires_at", { mode: "date", withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { mode: "date", withTimezone: true }),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex("prospect_report_snapshots_share_token_unique").on(table.shareTokenHash),
    uniqueIndex("prospect_report_snapshots_run_unique").on(table.runId),
    index("prospect_report_snapshots_request_idx").on(table.requestId, table.generatedAt.desc()),
    check(
      "prospect_report_snapshots_scores_range",
      sql`${table.overallScore} between 0 and 100 and ${table.coverageBps} between 0 and 10000 and ${table.confidenceBps} between 0 and 10000`,
    ),
    check("prospect_report_snapshots_expiry_after_generation", sql`${table.expiresAt} > ${table.generatedAt}`),
  ],
);

export const prospectReportAccess = pgTable(
  "prospect_report_access",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reportId: uuid("report_id")
      .notNull()
      .references(() => prospectReportSnapshots.id, { onDelete: "cascade" }),
    accessLevel: reportAccessLevelEnum("access_level").notNull(),
    granteeEmailHash: text("grantee_email_hash"),
    userId: uuid("user_id").references(() => users.id, { onDelete: "restrict" }),
    granteeStoreId: uuid("grantee_store_id").references(() => stores.id, {
      onDelete: "restrict",
    }),
    grantedAt: timestamp("granted_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp("expires_at", { mode: "date", withTimezone: true }),
    revokedAt: timestamp("revoked_at", { mode: "date", withTimezone: true }),
    createdAt: createdAt(),
  },
  (table) => [
    index("prospect_report_access_report_idx").on(table.reportId, table.revokedAt),
    index("prospect_report_access_user_idx").on(table.userId),
    index("prospect_report_access_store_idx").on(table.granteeStoreId),
    check(
      "prospect_report_access_has_grantee",
      sql`num_nonnulls(${table.granteeEmailHash}, ${table.userId}, ${table.granteeStoreId}) >= 1`,
    ),
  ],
);

export const reportOrders = pgTable(
  "report_orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reportId: uuid("report_id")
      .notNull()
      .references(() => prospectReportSnapshots.id, { onDelete: "restrict" }),
    status: reportOrderStatusEnum("status").default("pending_payment").notNull(),
    amountMinor: integer("amount_minor").default(39900).notNull(),
    currency: text("currency").default("SAR").notNull(),
    buyerNameEncrypted: text("buyer_name_encrypted").notNull(),
    buyerEmailEncrypted: text("buyer_email_encrypted").notNull(),
    buyerPhoneEncrypted: text("buyer_phone_encrypted").notNull(),
    paymentReference: text("payment_reference"),
    paidAt: timestamp("paid_at", { mode: "date", withTimezone: true }),
    fulfilledAt: timestamp("fulfilled_at", { mode: "date", withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { mode: "date", withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("report_orders_report_status_idx").on(table.reportId, table.status),
    uniqueIndex("report_orders_payment_reference_unique")
      .on(table.paymentReference)
      .where(sql`${table.paymentReference} is not null`),
    check("report_orders_amount_positive", sql`${table.amountMinor} > 0`),
    check("report_orders_currency_length", sql`char_length(${table.currency}) = 3`),
  ],
);

export const leadConsents = pgTable(
  "lead_consents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    requestId: uuid("request_id")
      .notNull()
      .references(() => prospectScanRequests.id, { onDelete: "cascade" }),
    reportOrderId: uuid("report_order_id").references(() => reportOrders.id, {
      onDelete: "set null",
    }),
    emailHash: text("email_hash").notNull(),
    emailEncrypted: text("email_encrypted"),
    marketingGranted: boolean("marketing_granted").default(false).notNull(),
    source: text("source").notNull(),
    capturedAt: timestamp("captured_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    withdrawnAt: timestamp("withdrawn_at", { mode: "date", withTimezone: true }),
    createdAt: createdAt(),
  },
  (table) => [
    index("lead_consents_request_idx").on(table.requestId, table.capturedAt.desc()),
    index("lead_consents_email_idx").on(table.emailHash),
  ],
);

export const providerCapabilities = pgTable(
  "provider_capabilities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    provider: text("provider").notNull(),
    surface: text("surface").notNull(),
    method: text("method").notNull(),
    state: providerCapabilityStateEnum("state").default("pending_verification").notNull(),
    automated: boolean("automated").default(false).notNull(),
    supportedLocales: text("supported_locales").array().default(sql`ARRAY[]::text[]`).notNull(),
    supportedCountries: text("supported_countries").array().default(sql`ARRAY[]::text[]`).notNull(),
    evidenceUrl: text("evidence_url"),
    limitations: text("limitations").notNull(),
    reviewedBy: text("reviewed_by"),
    verifiedAt: timestamp("verified_at", { mode: "date", withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("provider_capabilities_provider_surface_method_unique").on(
      table.provider,
      table.surface,
      table.method,
    ),
    index("provider_capabilities_state_idx").on(table.state, table.provider),
  ],
);

export const aiVisibilityCompetitors = pgTable(
  "ai_visibility_competitors",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    name: text("name").notNull(),
    domain: text("domain").notNull(),
    aliases: text("aliases").array().default(sql`ARRAY[]::text[]`).notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    unique("visibility_competitors_store_id_unique").on(table.storeId, table.id),
    uniqueIndex("visibility_competitors_store_domain_unique").on(
      table.storeId,
      sql`lower(${table.domain})`,
    ),
    index("visibility_competitors_store_active_idx").on(table.storeId, table.active),
  ],
);

export const aiVisibilityQueries = pgTable(
  "ai_visibility_queries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    query: text("query").notNull(),
    locale: localeEnum("locale").notNull(),
    countryCode: text("country_code").default("SA").notNull(),
    city: text("city"),
    deviceContext: text("device_context"),
    provider: text("provider").notNull(),
    active: boolean("active").default(true).notNull(),
    checkCadenceHours: integer("check_cadence_hours").default(168).notNull(),
    nextCheckAt: timestamp("next_check_at", { mode: "date", withTimezone: true }),
    createdByStoreMemberId: uuid("created_by_store_member_id").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    foreignKey({
      name: "visibility_queries_creator_fk",
      columns: [table.storeId, table.createdByStoreMemberId],
      foreignColumns: [storeMembers.storeId, storeMembers.id],
    }).onDelete("restrict"),
    unique("visibility_queries_store_id_unique").on(table.storeId, table.id),
    uniqueIndex("visibility_queries_monitor_unique").on(
      table.storeId,
      table.query,
      table.locale,
      table.countryCode,
      table.provider,
    ),
    index("visibility_queries_store_active_next_idx").on(
      table.storeId,
      table.active,
      table.nextCheckAt,
    ),
    index("visibility_queries_creator_idx").on(table.createdByStoreMemberId),
    check("visibility_queries_country_code_length", sql`char_length(${table.countryCode}) = 2`),
    check(
      "visibility_queries_cadence_positive",
      sql`${table.checkCadenceHours} > 0`,
    ),
  ],
);

export const aiVisibilityChecks = pgTable(
  "ai_visibility_checks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    queryId: uuid("query_id").notNull(),
    provider: text("provider").notNull(),
    status: visibilityCheckStatusEnum("status").default("queued").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    scheduledFor: timestamp("scheduled_for", { mode: "date", withTimezone: true }).notNull(),
    checkedAt: timestamp("checked_at", { mode: "date", withTimezone: true }),
    brandMentioned: boolean("brand_mentioned"),
    answerSummary: text("answer_summary"),
    sentiment: sentimentEnum("sentiment"),
    confidenceBps: integer("confidence_bps"),
    prominenceBps: integer("prominence_bps"),
    providerMethod: text("provider_method").notNull(),
    sourceReference: text("source_reference"),
    responseHash: text("response_hash"),
    unavailableReason: text("unavailable_reason"),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    createdAt: createdAt(),
  },
  (table) => [
    foreignKey({
      name: "visibility_checks_query_fk",
      columns: [table.storeId, table.queryId],
      foreignColumns: [aiVisibilityQueries.storeId, aiVisibilityQueries.id],
    }).onDelete("restrict"),
    unique("visibility_checks_store_id_unique").on(table.storeId, table.id),
    uniqueIndex("visibility_checks_store_idempotency_unique").on(
      table.storeId,
      table.idempotencyKey,
    ),
    uniqueIndex("visibility_checks_query_schedule_unique").on(
      table.queryId,
      table.provider,
      table.scheduledFor,
    ),
    index("visibility_checks_store_query_checked_idx").on(
      table.storeId,
      table.queryId,
      table.checkedAt.desc(),
    ),
    index("visibility_checks_store_status_scheduled_idx").on(
      table.storeId,
      table.status,
      table.scheduledFor,
    ),
    check("visibility_checks_scores_range", sql`
      (${table.confidenceBps} is null or ${table.confidenceBps} between 0 and 10000)
      and (${table.prominenceBps} is null or ${table.prominenceBps} between 0 and 10000)
    `),
  ],
);

export const aiVisibilityMentions = pgTable(
  "ai_visibility_mentions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    checkId: uuid("check_id").notNull(),
    competitorId: uuid("competitor_id"),
    productId: uuid("product_id"),
    entityType: text("entity_type").notNull(),
    entityName: text("entity_name").notNull(),
    merchantOwned: boolean("merchant_owned").default(false).notNull(),
    position: integer("position"),
    prominenceBps: integer("prominence_bps"),
    sentiment: sentimentEnum("sentiment").default("unknown").notNull(),
    confidenceBps: integer("confidence_bps").notNull(),
    evidenceExcerpt: text("evidence_excerpt"),
    createdAt: createdAt(),
  },
  (table) => [
    foreignKey({
      name: "visibility_mentions_check_fk",
      columns: [table.storeId, table.checkId],
      foreignColumns: [aiVisibilityChecks.storeId, aiVisibilityChecks.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "visibility_mentions_competitor_fk",
      columns: [table.storeId, table.competitorId],
      foreignColumns: [aiVisibilityCompetitors.storeId, aiVisibilityCompetitors.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "visibility_mentions_product_fk",
      columns: [table.storeId, table.productId],
      foreignColumns: [products.storeId, products.id],
    }).onDelete("restrict"),
    index("visibility_mentions_check_idx").on(table.checkId),
    index("visibility_mentions_competitor_idx").on(table.competitorId),
    index("visibility_mentions_product_idx").on(table.productId),
    index("visibility_mentions_store_entity_idx").on(
      table.storeId,
      table.entityType,
      table.createdAt.desc(),
    ),
    check(
      "visibility_mentions_position_positive",
      sql`${table.position} is null or ${table.position} > 0`,
    ),
    check("visibility_mentions_scores_range", sql`
      ${table.confidenceBps} between 0 and 10000
      and (${table.prominenceBps} is null or ${table.prominenceBps} between 0 and 10000)
    `),
  ],
);

export const aiVisibilityCitations = pgTable(
  "ai_visibility_citations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    checkId: uuid("check_id").notNull(),
    url: text("url").notNull(),
    domain: text("domain").notNull(),
    title: text("title"),
    position: integer("position"),
    merchantOwned: boolean("merchant_owned").default(false).notNull(),
    accessibleAtCheck: boolean("accessible_at_check"),
    confidenceBps: integer("confidence_bps").notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    foreignKey({
      name: "visibility_citations_check_fk",
      columns: [table.storeId, table.checkId],
      foreignColumns: [aiVisibilityChecks.storeId, aiVisibilityChecks.id],
    }).onDelete("restrict"),
    uniqueIndex("visibility_citations_check_url_unique").on(table.checkId, table.url),
    index("visibility_citations_store_domain_idx").on(
      table.storeId,
      table.domain,
      table.createdAt.desc(),
    ),
    check(
      "visibility_citations_position_positive",
      sql`${table.position} is null or ${table.position} > 0`,
    ),
    check(
      "visibility_citations_confidence_range",
      sql`${table.confidenceBps} between 0 and 10000`,
    ),
  ],
);

/** Readiness score snapshots are distinct from observed mentions and citations. */
export const aiVisibilityScores = pgTable(
  "ai_visibility_scores",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    scoreType: text("score_type").notNull(),
    overallScore: integer("overall_score").notNull(),
    methodologyVersion: text("methodology_version").notNull(),
    evidenceCount: integer("evidence_count").default(0).notNull(),
    confidenceBps: integer("confidence_bps").notNull(),
    explanation: text("explanation").notNull(),
    capturedAt: timestamp("captured_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    unique("visibility_scores_store_id_unique").on(table.storeId, table.id),
    uniqueIndex("visibility_scores_store_type_capture_unique").on(
      table.storeId,
      table.scoreType,
      table.capturedAt,
    ),
    index("visibility_scores_store_type_capture_idx").on(
      table.storeId,
      table.scoreType,
      table.capturedAt.desc(),
    ),
    check("visibility_scores_ranges", sql`
      ${table.overallScore} between 0 and 100
      and ${table.confidenceBps} between 0 and 10000
      and ${table.evidenceCount} >= 0
    `),
  ],
);

export const aiVisibilityScoreComponents = pgTable(
  "ai_visibility_score_components",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    scoreId: uuid("score_id").notNull(),
    component: text("component").notNull(),
    score: integer("score").notNull(),
    weightBps: integer("weight_bps").notNull(),
    evidence: jsonb("evidence").$type<JsonObject>().notNull(),
    recommendedFix: text("recommended_fix"),
    createdAt: createdAt(),
  },
  (table) => [
    foreignKey({
      name: "visibility_score_components_score_fk",
      columns: [table.storeId, table.scoreId],
      foreignColumns: [aiVisibilityScores.storeId, aiVisibilityScores.id],
    }).onDelete("restrict"),
    uniqueIndex("visibility_score_components_score_name_unique").on(
      table.scoreId,
      table.component,
    ),
    index("visibility_score_components_store_component_idx").on(
      table.storeId,
      table.component,
    ),
    check(
      "visibility_score_components_ranges",
      sql`${table.score} between 0 and 100 and ${table.weightBps} between 0 and 10000`,
    ),
  ],
);

export const pageAudits = pgTable(
  "page_audits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    pageId: uuid("page_id").notNull(),
    status: jobStatusEnum("status").default("queued").notNull(),
    auditVersion: text("audit_version").notNull(),
    overallScore: integer("overall_score"),
    technicalScore: integer("technical_score"),
    contentScore: integer("content_score"),
    answerabilityScore: integer("answerability_score"),
    structuredDataScore: integer("structured_data_score"),
    evidence: jsonb("evidence").$type<JsonObject>().default(emptyJson).notNull(),
    startedAt: timestamp("started_at", { mode: "date", withTimezone: true }),
    completedAt: timestamp("completed_at", { mode: "date", withTimezone: true }),
    createdAt: createdAt(),
  },
  (table) => [
    foreignKey({
      name: "page_audits_page_fk",
      columns: [table.storeId, table.pageId],
      foreignColumns: [storePages.storeId, storePages.id],
    }).onDelete("restrict"),
    unique("page_audits_store_id_unique").on(table.storeId, table.id),
    index("page_audits_page_created_idx").on(table.pageId, table.createdAt.desc()),
    index("page_audits_store_status_idx").on(table.storeId, table.status),
    check("page_audits_score_ranges", sql`
      (${table.overallScore} is null or ${table.overallScore} between 0 and 100)
      and (${table.technicalScore} is null or ${table.technicalScore} between 0 and 100)
      and (${table.contentScore} is null or ${table.contentScore} between 0 and 100)
      and (${table.answerabilityScore} is null or ${table.answerabilityScore} between 0 and 100)
      and (${table.structuredDataScore} is null or ${table.structuredDataScore} between 0 and 100)
    `),
  ],
);

export const productAudits = pgTable(
  "product_audits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    productId: uuid("product_id").notNull(),
    status: jobStatusEnum("status").default("queued").notNull(),
    auditVersion: text("audit_version").notNull(),
    overallScore: integer("overall_score"),
    contentScore: integer("content_score"),
    seoScore: integer("seo_score"),
    aiReadinessScore: integer("ai_readiness_score"),
    safetyScore: integer("safety_score"),
    evidence: jsonb("evidence").$type<JsonObject>().default(emptyJson).notNull(),
    startedAt: timestamp("started_at", { mode: "date", withTimezone: true }),
    completedAt: timestamp("completed_at", { mode: "date", withTimezone: true }),
    createdAt: createdAt(),
  },
  (table) => [
    foreignKey({
      name: "product_audits_product_fk",
      columns: [table.storeId, table.productId],
      foreignColumns: [products.storeId, products.id],
    }).onDelete("restrict"),
    unique("product_audits_store_id_unique").on(table.storeId, table.id),
    index("product_audits_product_created_idx").on(
      table.productId,
      table.createdAt.desc(),
    ),
    index("product_audits_store_status_idx").on(table.storeId, table.status),
    check("product_audits_score_ranges", sql`
      (${table.overallScore} is null or ${table.overallScore} between 0 and 100)
      and (${table.contentScore} is null or ${table.contentScore} between 0 and 100)
      and (${table.seoScore} is null or ${table.seoScore} between 0 and 100)
      and (${table.aiReadinessScore} is null or ${table.aiReadinessScore} between 0 and 100)
      and (${table.safetyScore} is null or ${table.safetyScore} between 0 and 100)
    `),
  ],
);

export const auditFindings = pgTable(
  "audit_findings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    pageAuditId: uuid("page_audit_id"),
    productAuditId: uuid("product_audit_id"),
    code: text("code").notNull(),
    category: text("category").notNull(),
    severity: priorityEnum("severity").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    evidence: jsonb("evidence").$type<JsonObject>().notNull(),
    recommendedFix: text("recommended_fix").notNull(),
    confidenceBps: integer("confidence_bps").notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    foreignKey({
      name: "audit_findings_page_audit_fk",
      columns: [table.storeId, table.pageAuditId],
      foreignColumns: [pageAudits.storeId, pageAudits.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "audit_findings_product_audit_fk",
      columns: [table.storeId, table.productAuditId],
      foreignColumns: [productAudits.storeId, productAudits.id],
    }).onDelete("restrict"),
    index("audit_findings_page_audit_idx").on(table.pageAuditId),
    index("audit_findings_product_audit_idx").on(table.productAuditId),
    index("audit_findings_store_severity_idx").on(
      table.storeId,
      table.severity,
      table.createdAt.desc(),
    ),
    check(
      "audit_findings_exactly_one_parent",
      sql`num_nonnulls(${table.pageAuditId}, ${table.productAuditId}) = 1`,
    ),
    check(
      "audit_findings_confidence_range",
      sql`${table.confidenceBps} between 0 and 10000`,
    ),
  ],
);

export const plans = pgTable(
  "plans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    billingInterval: billingIntervalEnum("billing_interval").notNull(),
    currency: text("currency").default("SAR").notNull(),
    priceMinor: bigint("price_minor", { mode: "number" }).notNull(),
    active: boolean("active").default(true).notNull(),
    trialDays: integer("trial_days").default(0).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("plans_code_unique").on(table.code),
    index("plans_active_idx").on(table.active),
    check("plans_price_nonnegative", sql`${table.priceMinor} >= 0`),
    check("plans_trial_days_nonnegative", sql`${table.trialDays} >= 0`),
    check("plans_currency_iso_length", sql`char_length(${table.currency}) = 3`),
  ],
);

export const entitlements = pgTable(
  "entitlements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    planId: uuid("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "restrict" }),
    key: text("key").notNull(),
    enabled: boolean("enabled").default(true).notNull(),
    limit: bigint("limit", { mode: "number" }),
    unit: text("unit"),
    configuration: jsonb("configuration").$type<JsonObject>().default(emptyJson).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("entitlements_plan_key_unique").on(table.planId, table.key),
    index("entitlements_key_idx").on(table.key),
    check("entitlements_limit_nonnegative", sql`${table.limit} is null or ${table.limit} >= 0`),
  ],
);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    planId: uuid("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "restrict" }),
    provider: text("provider").notNull(),
    externalCustomerId: text("external_customer_id"),
    externalSubscriptionId: text("external_subscription_id"),
    status: subscriptionStatusEnum("status").notNull(),
    currency: text("currency").default("SAR").notNull(),
    amountMinor: bigint("amount_minor", { mode: "number" }).notNull(),
    currentPeriodStart: timestamp("current_period_start", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    currentPeriodEnd: timestamp("current_period_end", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    trialEndsAt: timestamp("trial_ends_at", { mode: "date", withTimezone: true }),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
    cancelledAt: timestamp("cancelled_at", { mode: "date", withTimezone: true }),
    endedAt: timestamp("ended_at", { mode: "date", withTimezone: true }),
    providerData: jsonb("provider_data").$type<JsonObject>().default(emptyJson).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    unique("subscriptions_store_id_unique").on(table.storeId, table.id),
    uniqueIndex("subscriptions_provider_external_unique")
      .on(table.provider, table.externalSubscriptionId)
      .where(sql`${table.externalSubscriptionId} is not null`),
    index("subscriptions_store_status_idx").on(table.storeId, table.status),
    index("subscriptions_plan_idx").on(table.planId),
    check("subscriptions_amount_nonnegative", sql`${table.amountMinor} >= 0`),
    check(
      "subscriptions_period_valid",
      sql`${table.currentPeriodEnd} > ${table.currentPeriodStart}`,
    ),
    check("subscriptions_currency_iso_length", sql`char_length(${table.currency}) = 3`),
  ],
);

/** Append-only, idempotent metered-usage ledger. */
export const usageRecords = pgTable(
  "usage_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    subscriptionId: uuid("subscription_id"),
    metric: text("metric").notNull(),
    quantity: bigint("quantity", { mode: "number" }).notNull(),
    sourceEventId: text("source_event_id").notNull(),
    occurredAt: timestamp("occurred_at", { mode: "date", withTimezone: true }).notNull(),
    billingPeriodStart: timestamp("billing_period_start", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    billingPeriodEnd: timestamp("billing_period_end", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    metadata: jsonb("metadata").$type<JsonObject>().default(emptyJson).notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    foreignKey({
      name: "usage_records_subscription_fk",
      columns: [table.storeId, table.subscriptionId],
      foreignColumns: [subscriptions.storeId, subscriptions.id],
    }).onDelete("restrict"),
    uniqueIndex("usage_records_store_metric_source_unique").on(
      table.storeId,
      table.metric,
      table.sourceEventId,
    ),
    index("usage_records_store_metric_occurred_idx").on(
      table.storeId,
      table.metric,
      table.occurredAt.desc(),
      table.id.desc(),
    ),
    index("usage_records_subscription_idx").on(table.subscriptionId),
    check("usage_records_quantity_positive", sql`${table.quantity} > 0`),
    check(
      "usage_records_period_valid",
      sql`${table.billingPeriodEnd} > ${table.billingPeriodStart}`,
    ),
  ],
);

/** Append-only audit trail. Redactions are represented by follow-up records. */
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: storeId(),
    actorUserId: uuid("actor_user_id").references(() => users.id, {
      onDelete: "restrict",
    }),
    actorStoreMemberId: uuid("actor_store_member_id"),
    actorType: text("actor_type").notNull(),
    action: text("action").notNull(),
    resourceType: text("resource_type").notNull(),
    resourceId: text("resource_id"),
    requestId: text("request_id"),
    idempotencyKey: text("idempotency_key"),
    ipAddressHash: text("ip_address_hash"),
    before: jsonb("before").$type<JsonObject>(),
    after: jsonb("after").$type<JsonObject>(),
    metadata: jsonb("metadata").$type<JsonObject>().default(emptyJson).notNull(),
    occurredAt: timestamp("occurred_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    foreignKey({
      name: "audit_logs_store_member_fk",
      columns: [table.storeId, table.actorStoreMemberId],
      foreignColumns: [storeMembers.storeId, storeMembers.id],
    }).onDelete("restrict"),
    uniqueIndex("audit_logs_store_idempotency_unique")
      .on(table.storeId, table.idempotencyKey)
      .where(sql`${table.idempotencyKey} is not null`),
    index("audit_logs_store_occurred_idx").on(
      table.storeId,
      table.occurredAt.desc(),
      table.id.desc(),
    ),
    index("audit_logs_resource_idx").on(
      table.storeId,
      table.resourceType,
      table.resourceId,
      table.occurredAt.desc(),
    ),
    index("audit_logs_actor_user_idx").on(table.actorUserId),
    index("audit_logs_actor_member_idx").on(table.actorStoreMemberId),
    index("audit_logs_request_idx").on(table.requestId),
  ],
);
