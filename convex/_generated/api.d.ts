/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ResendOTP from "../ResendOTP.js";
import type * as ResendOTPPasswordReset from "../ResendOTPPasswordReset.js";
import type * as adminAlerts from "../adminAlerts.js";
import type * as aiMetrics from "../aiMetrics.js";
import type * as auth from "../auth.js";
import type * as bids from "../bids.js";
import type * as categories from "../categories.js";
import type * as contact from "../contact.js";
import type * as creditTransactions from "../creditTransactions.js";
import type * as crons from "../crons.js";
import type * as emails from "../emails.js";
import type * as http from "../http.js";
import type * as jobPostAssistant from "../jobPostAssistant.js";
import type * as jobPostAssistantEval from "../jobPostAssistantEval.js";
import type * as jobs from "../jobs.js";
import type * as messages from "../messages.js";
import type * as notifications from "../notifications.js";
import type * as portfolio from "../portfolio.js";
import type * as pricing from "../pricing.js";
import type * as ratings from "../ratings.js";
import type * as seed from "../seed.js";
import type * as stats from "../stats.js";
import type * as stripe from "../stripe.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ResendOTP: typeof ResendOTP;
  ResendOTPPasswordReset: typeof ResendOTPPasswordReset;
  adminAlerts: typeof adminAlerts;
  aiMetrics: typeof aiMetrics;
  auth: typeof auth;
  bids: typeof bids;
  categories: typeof categories;
  contact: typeof contact;
  creditTransactions: typeof creditTransactions;
  crons: typeof crons;
  emails: typeof emails;
  http: typeof http;
  jobPostAssistant: typeof jobPostAssistant;
  jobPostAssistantEval: typeof jobPostAssistantEval;
  jobs: typeof jobs;
  messages: typeof messages;
  notifications: typeof notifications;
  portfolio: typeof portfolio;
  pricing: typeof pricing;
  ratings: typeof ratings;
  seed: typeof seed;
  stats: typeof stats;
  stripe: typeof stripe;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
