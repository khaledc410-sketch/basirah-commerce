import "server-only";

import {
  catalogRepository,
  type CatalogCategoryInput,
  type CatalogProductInput,
  type CatalogRepository,
  type CatalogStoreInput,
} from "@/db/repositories/catalog-repository";
import {
  catalogSyncResources,
  createSyncRepository,
  type CatalogSyncResource,
  type SyncRepository,
} from "@/db/repositories/sync-repository";
import type { JsonObject } from "@/db/schema";

export interface CatalogPageRequest {
  page: number;
  perPage: number;
}

export interface CatalogPage<T> {
  items: T[];
  total: number;
  currentPage: number;
  totalPages: number;
  perPage: number;
}

/**
 * Credential-bound source contract for the sync worker. The Salla adapter can
 * implement this without exposing tokens to the queue payload or this service.
 */
export interface CatalogSyncSource {
  getStore(): Promise<CatalogStoreInput>;
  listCategories(request: CatalogPageRequest): Promise<CatalogPage<CatalogCategoryInput>>;
  listProducts(request: CatalogPageRequest): Promise<CatalogPage<CatalogProductInput>>;
}

export interface ProcessCatalogRunInput {
  storeId: string;
  connectionId: string;
  /** Credential generation used to fetch this run; every commit revalidates it. */
  connectionTokenVersion: number;
  runId: string;
  source: CatalogSyncSource;
  perPage?: number;
}

export interface HandleCatalogPreflightFailureInput {
  storeId: string;
  connectionId: string;
  runId: string;
  error: unknown;
  finalAttempt: boolean;
}

export interface CatalogSyncFailure {
  code: string;
  message: string;
  retryable: boolean;
  details: JsonObject;
}

export class CatalogSyncExecutionError extends Error {
  constructor(
    readonly failure: CatalogSyncFailure,
    options?: ErrorOptions,
  ) {
    super(failure.message, options);
    this.name = "CatalogSyncExecutionError";
  }
}

interface ErrorWithStatus {
  status?: unknown;
  statusCode?: unknown;
  code?: unknown;
  reason?: unknown;
  name?: unknown;
  kind?: unknown;
}

class CatalogConnectionBoundaryError extends Error {
  readonly kind = "unauthorized";
  readonly reason = "connection_changed";

  constructor() {
    super("The catalog connection changed or was revoked during sync.");
    this.name = "CatalogConnectionBoundaryError";
  }
}

export function classifyCatalogSyncError(error: unknown): CatalogSyncFailure {
  const candidate = (typeof error === "object" && error !== null ? error : {}) as ErrorWithStatus;
  const statusValue = candidate.status ?? candidate.statusCode;
  const status = typeof statusValue === "number" ? statusValue : Number(statusValue);
  const details: JsonObject = {};
  if (Number.isInteger(status) && status > 0) details.status = status;

  if (
    candidate.name === "AbortError" ||
    candidate.name === "TimeoutError" ||
    candidate.code === "ETIMEDOUT" ||
    candidate.kind === "timeout"
  ) {
    return {
      code: "platform_timeout",
      message: "The commerce platform request timed out.",
      retryable: true,
      details,
    };
  }
  if (status === 429 || candidate.kind === "rate_limited") {
    return {
      code: "platform_rate_limited",
      message: "The commerce platform rate limit was reached.",
      retryable: true,
      details,
    };
  }
  if (status === 408 || status >= 500 || (candidate.kind === "http" && !Number.isInteger(status))) {
    return {
      code: "platform_temporarily_unavailable",
      message: "The commerce platform is temporarily unavailable.",
      retryable: true,
      details,
    };
  }
  if (
    status === 401 ||
    status === 403 ||
    candidate.kind === "unauthorized" ||
    candidate.reason === "missing_credentials"
  ) {
    return {
      code: "platform_authorization_failed",
      message: "The store connection is not authorized for catalog access.",
      retryable: false,
      details,
    };
  }
  if (candidate.reason === "pending_verification" || candidate.reason === "not_supported") {
    return {
      code: "platform_capability_unavailable",
      message: "The required catalog capability is not available for this connection.",
      retryable: false,
      details,
    };
  }
  return {
    code: "catalog_sync_failed",
    message: "The catalog sync failed while validating or persisting platform data.",
    retryable: false,
    details,
  };
}

const deterministicPreflightMessages = [
  "does not have a connected salla account",
  "connection has expired and cannot be refreshed",
  "connection was disconnected",
  "connection is no longer active",
  "token belongs to a different merchant",
  "refreshed salla connection could not be loaded",
] as const;

/**
 * Preflight runs before a resource job is claimed. Unknown operational errors
 * are therefore retried, while known credential/boundary failures stop
 * immediately. Raw exception messages are never persisted.
 */
export function classifyCatalogPreflightError(error: unknown): CatalogSyncFailure {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (deterministicPreflightMessages.some((part) => message.includes(part))) {
    return {
      code: "platform_authorization_failed",
      message: "The store connection is not authorized for catalog access.",
      retryable: false,
      details: {},
    };
  }
  if (message.includes("credential refresh is already in progress")) {
    return {
      code: "platform_refresh_in_progress",
      message: "The store credential refresh is still in progress.",
      retryable: true,
      details: {},
    };
  }

  const tokenStatus = Number(message.match(/token exchange failed with status (\d{3})/u)?.[1]);
  if (
    Number.isInteger(tokenStatus) &&
    tokenStatus >= 400 &&
    tokenStatus < 500 &&
    tokenStatus !== 408 &&
    tokenStatus !== 429
  ) {
    return {
      code: "platform_authorization_failed",
      message: "The store connection is not authorized for catalog access.",
      retryable: false,
      details: { status: tokenStatus },
    };
  }
  const classified = classifyCatalogSyncError(
    Number.isInteger(tokenStatus) ? { status: tokenStatus } : error,
  );
  if (classified.code !== "catalog_sync_failed") return classified;

  return {
    code: "catalog_preflight_failed",
    message: "The catalog sync could not prepare the store connection.",
    retryable: true,
    details: {},
  };
}

export function validateCatalogPage<T>(page: CatalogPage<T>, requestedPage: number) {
  if (
    !Number.isInteger(page.currentPage) ||
    page.currentPage < 1 ||
    page.currentPage !== requestedPage ||
    !Number.isInteger(page.totalPages) ||
    page.totalPages < 0 ||
    !Number.isInteger(page.total) ||
    page.total < 0 ||
    !Number.isInteger(page.perPage) ||
    page.perPage < 1 ||
    !Array.isArray(page.items)
  ) {
    throw new Error("The platform returned invalid catalog pagination metadata.");
  }
  if (page.totalPages > 0 && page.currentPage > page.totalPages) {
    throw new Error("The platform returned a page beyond the declared catalog page range.");
  }
  return page;
}

export function readNextPage(cursor: JsonObject | null, defaultPage = 1): number | null {
  if (!cursor) return defaultPage;
  if (cursor.complete === true || cursor.nextPage === null) return null;
  return typeof cursor.nextPage === "number" && Number.isInteger(cursor.nextPage) && cursor.nextPage > 0
    ? cursor.nextPage
    : defaultPage;
}

function pageCursor(page: CatalogPage<unknown>): JsonObject {
  const nextPage = page.currentPage < page.totalPages ? page.currentPage + 1 : null;
  return {
    version: 1,
    page: page.currentPage,
    nextPage,
    perPage: page.perPage,
    complete: nextPage === null,
  };
}

function latestSourceUpdate(
  records: readonly { sourceUpdatedAt?: Date | null }[],
): Date | undefined {
  return records.reduce<Date | undefined>((latest, record) => {
    if (!record.sourceUpdatedAt) return latest;
    return !latest || record.sourceUpdatedAt > latest ? record.sourceUpdatedAt : latest;
  }, undefined);
}

export function createCatalogSyncService(dependencies?: {
  syncRepository?: SyncRepository;
  catalogRepository?: CatalogRepository;
  now?: () => Date;
}) {
  const syncRepository = dependencies?.syncRepository ?? createSyncRepository();
  const catalog = dependencies?.catalogRepository ?? catalogRepository;
  const now = dependencies?.now ?? (() => new Date());

  async function assertActiveConnection(input: ProcessCatalogRunInput) {
    const active = await syncRepository.isActiveConnectionBoundary(
      input.storeId,
      input.connectionId,
      input.connectionTokenVersion,
    );
    if (!active) throw new CatalogConnectionBoundaryError();
  }

  async function processStore(
    input: ProcessCatalogRunInput,
    job: Awaited<ReturnType<SyncRepository["claimJob"]>>,
  ) {
    if (!job) throw new Error("The store sync job could not be claimed.");
    if (readNextPage(job.cursor) !== null) {
      await assertActiveConnection(input);
      const profile = await input.source.getStore();
      const committedAt = now();
      await syncRepository.commitPage(
        {
          storeId: input.storeId,
          jobId: job.id,
          connectionId: input.connectionId,
          connectionTokenVersion: input.connectionTokenVersion,
          resourceType: "store",
          cursor: { version: 1, complete: true, nextPage: null },
          recordsProcessed: 1,
          recordsTotal: 1,
          sourceVersion: "catalog-store-v1",
          heartbeatAt: committedAt,
        },
        (tx) => catalog.upsertStoreProfile(tx, { storeId: input.storeId, profile, updatedAt: committedAt }),
      );
    }
    await syncRepository.completeJob({
      storeId: input.storeId,
      jobId: job.id,
      connectionId: input.connectionId,
      connectionTokenVersion: input.connectionTokenVersion,
      resourceType: "store",
      completedAt: now(),
    });
  }

  async function processCategories(
    input: ProcessCatalogRunInput,
    job: NonNullable<Awaited<ReturnType<SyncRepository["claimJob"]>>>,
    perPage: number,
  ) {
    const scanStartedAt = job.startedAt ?? now();
    let nextPage = readNextPage(job.cursor);
    while (nextPage !== null) {
      await assertActiveConnection(input);
      const page = validateCatalogPage(
        await input.source.listCategories({ page: nextPage, perPage }),
        nextPage,
      );
      const committedAt = now();
      await syncRepository.commitPage(
        {
          storeId: input.storeId,
          jobId: job.id,
          connectionId: input.connectionId,
          connectionTokenVersion: input.connectionTokenVersion,
          resourceType: "categories",
          cursor: pageCursor(page),
          recordsProcessed: page.items.length,
          recordsTotal: page.total,
          sourceVersion: "catalog-categories-v1",
          lastExternalUpdatedAt: latestSourceUpdate(page.items),
          heartbeatAt: committedAt,
        },
        (tx) =>
          catalog.upsertCategoryPage(tx, {
            storeId: input.storeId,
            categories: page.items,
            seenAt: committedAt,
          }),
      );
      nextPage = page.currentPage < page.totalPages ? page.currentPage + 1 : null;
    }

    const completedAt = now();
    await syncRepository.completeJob({
      storeId: input.storeId,
      jobId: job.id,
      connectionId: input.connectionId,
      connectionTokenVersion: input.connectionTokenVersion,
      resourceType: "categories",
      completedAt,
      apply: async (tx) => {
        await catalog.resolveCategoryParents(tx, input.storeId, completedAt);
        return catalog.finalizeCategoryScan(tx, {
          storeId: input.storeId,
          scanStartedAt,
          completedAt,
        });
      },
    });
  }

  async function processProducts(
    input: ProcessCatalogRunInput,
    job: NonNullable<Awaited<ReturnType<SyncRepository["claimJob"]>>>,
    perPage: number,
  ) {
    const scanStartedAt = job.startedAt ?? now();
    let nextPage = readNextPage(job.cursor);
    while (nextPage !== null) {
      await assertActiveConnection(input);
      const page = validateCatalogPage(
        await input.source.listProducts({ page: nextPage, perPage }),
        nextPage,
      );
      const committedAt = now();
      await syncRepository.commitPage(
        {
          storeId: input.storeId,
          jobId: job.id,
          connectionId: input.connectionId,
          connectionTokenVersion: input.connectionTokenVersion,
          resourceType: "products",
          cursor: pageCursor(page),
          recordsProcessed: page.items.length,
          recordsTotal: page.total,
          sourceVersion: "catalog-products-v1",
          lastExternalUpdatedAt: latestSourceUpdate(page.items),
          heartbeatAt: committedAt,
        },
        (tx) =>
          catalog.upsertProductPage(tx, {
            storeId: input.storeId,
            products: page.items,
            seenAt: committedAt,
          }),
      );
      nextPage = page.currentPage < page.totalPages ? page.currentPage + 1 : null;
    }

    const completedAt = now();
    await syncRepository.completeJob({
      storeId: input.storeId,
      jobId: job.id,
      connectionId: input.connectionId,
      connectionTokenVersion: input.connectionTokenVersion,
      resourceType: "products",
      completedAt,
      apply: (tx) =>
        catalog.finalizeProductScan(tx, {
          storeId: input.storeId,
          scanStartedAt,
          completedAt,
        }),
    });
  }

  return {
    async handlePreflightFailure(input: HandleCatalogPreflightFailureInput) {
      const failure = classifyCatalogPreflightError(input.error);
      if (failure.retryable && !input.finalAttempt) {
        return { failure, recorded: false };
      }
      const failedJob = await syncRepository.recordRunFailure({
        storeId: input.storeId,
        connectionId: input.connectionId,
        runId: input.runId,
        errorCode: failure.code,
        message: failure.message,
        retryable: failure.retryable,
        details: failure.details,
        occurredAt: now(),
      });
      return { failure, recorded: Boolean(failedJob) };
    },

    async processRun(input: ProcessCatalogRunInput) {
      const perPage = input.perPage ?? 50;
      if (!Number.isInteger(perPage) || perPage < 1 || perPage > 100) {
        throw new Error("Catalog sync page size must be an integer between 1 and 100.");
      }

      let jobs = await syncRepository.listRunJobs(input.storeId, input.runId);
      if (
        jobs.length !== catalogSyncResources.length ||
        jobs.some((job) => job.connectionId !== input.connectionId)
      ) {
        throw new Error("The catalog sync run is incomplete or outside the connection boundary.");
      }

      for (const resourceType of catalogSyncResources) {
        let job = jobs.find((candidate) => candidate.resourceType === resourceType);
        if (!job) throw new Error(`Missing ${resourceType} sync job.`);
        if (job.status === "succeeded") continue;
        if (job.status === "failed") {
          const requeued = await syncRepository.requeueFailedJob(input.storeId, job.id, now());
          if (!requeued) throw new Error(`The ${resourceType} sync failure is not retryable.`);
          job = requeued;
        }
        if (job.status === "dead_letter" || job.status === "cancelled") {
          throw new Error(`The ${resourceType} sync job is terminal.`);
        }

        const claimed = await syncRepository.claimJob(input.storeId, job.id, now());
        if (!claimed) throw new Error(`The ${resourceType} sync job could not be claimed.`);

        try {
          if (resourceType === "store") await processStore(input, claimed);
          if (resourceType === "categories") await processCategories(input, claimed, perPage);
          if (resourceType === "products") await processProducts(input, claimed, perPage);
        } catch (error) {
          const failure = classifyCatalogSyncError(error);
          await syncRepository.recordFailure({
            storeId: input.storeId,
            jobId: claimed.id,
            resourceType,
            errorCode: failure.code,
            message: failure.message,
            retryable: failure.retryable,
            details: failure.details,
            occurredAt: now(),
          });
          throw new CatalogSyncExecutionError(failure, { cause: error });
        }

        jobs = await syncRepository.listRunJobs(input.storeId, input.runId);
      }
      return syncRepository.getRunStatus(input.storeId, input.runId);
    },
  };
}

export type CatalogSyncService = ReturnType<typeof createCatalogSyncService>;

export function isCatalogResource(value: string): value is CatalogSyncResource {
  return catalogSyncResources.includes(value as CatalogSyncResource);
}
