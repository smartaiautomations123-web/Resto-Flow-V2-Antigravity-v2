import { createClient } from "@supabase/supabase-js";
import { ForbiddenError } from "@shared/_core/errors";
import type { Request } from "express";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

class SDKServer {
  private _supabase: ReturnType<typeof createClient> | null = null;
  private get supabase() {
    if (!this._supabase) {
      if (!ENV.supabaseUrl) {
        console.warn("[SDK] ENV.supabaseUrl is not defined yet!");
      }
      try {
        this._supabase = createClient(ENV.supabaseUrl.replace(/^["'](.+(?=["']$))["']$/, '$1'), ENV.supabaseAnonKey.replace(/^["'](.+(?=["']$))["']$/, '$1'));
      } catch (e: any) {
        console.error("[SDK] Error creating Supabase client:", e.message, "URL was:", ENV.supabaseUrl);
        throw e;
      }
    }
    return this._supabase;
  }

  async authenticateRequest(req: Request): Promise<User> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        throw ForbiddenError("Missing or invalid authorization header");
      }

      const token = authHeader.split(" ")[1];

      let getUserResult: any;
      try {
        getUserResult = await this.supabase.auth.getUser(token);
      } catch (e: any) {
        console.error("[Auth] Exception during getUser:", e.stack || e);
        throw ForbiddenError("Invalid token or fetch failed");
      }

      const { data: { user: supabaseUser }, error } = getUserResult;

      if (error || !supabaseUser) {
        console.warn("[Auth] Supabase verification failed:", error?.message);
        throw ForbiddenError("Invalid token");
      }

      const sessionUserId = supabaseUser.id;
      const signedInAt = new Date();
      let user = await db.getUserByOpenId(sessionUserId);

      // If user not in DB, sync from Auth server automatically
      if (!user) {
        try {
          await db.upsertUser({
            openId: sessionUserId,
            name: supabaseUser.user_metadata?.name || supabaseUser.email?.split("@")[0] || null,
            email: supabaseUser.email ?? null,
            loginMethod: "email",
            lastSignedIn: signedInAt,
          });
          user = await db.getUserByOpenId(sessionUserId);
        } catch (err) {
          console.error("[Auth] Failed to sync user:", err);
          throw ForbiddenError("Failed to sync user info");
        }
      }

      if (!user) {
        throw ForbiddenError("User not found");
      }

      // Keep it refreshed
      await db.upsertUser({
        openId: user.openId,
        name: user.name,
        email: user.email,
        loginMethod: user.loginMethod,
        lastSignedIn: signedInAt,
      });

      return user;
    } catch (totalErr: any) {
      console.error("[Auth] FATAL inside authenticateRequest:", totalErr.stack || totalErr);
      throw totalErr;
    }
  }
}

export const sdk = new SDKServer();
