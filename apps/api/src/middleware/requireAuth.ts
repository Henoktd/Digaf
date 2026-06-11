import { createClient } from "@supabase/supabase-js";
import type { Request, Response, NextFunction } from "express";
import { isAllowedRole } from "../utils/roles";
import type { ActorRole } from "../utils/roles";

// Extend Express Request with authenticated actor context
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth: {
        actorId: string;
        actorEmail: string;
        actorRole: ActorRole;
      };
    }
  }
}

function makeSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const supabaseAdmin = makeSupabaseAdmin();

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // If Supabase is not configured, reject with a clear message
  if (!supabaseAdmin) {
    res.status(503).json({
      error: {
        message:
          "Authentication service not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      },
    });
    return;
  }

  const authHeader = req.headers.authorization;
  // Allow ?token= query param for browser-navigable GET endpoints (print-preview, downloads)
  const queryToken =
    req.method === "GET" && typeof req.query.token === "string"
      ? req.query.token
      : null;

  if (!authHeader?.startsWith("Bearer ") && !queryToken) {
    res.status(401).json({
      error: { message: "Authorization header with Bearer token required" },
    });
    return;
  }

  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : (queryToken as string);

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    res.status(401).json({
      error: { message: "Invalid or expired authentication token" },
    });
    return;
  }

  const role = user.app_metadata?.role as unknown;
  if (!isAllowedRole(role)) {
    res.status(403).json({
      error: {
        message:
          "No valid governance role assigned. Contact your administrator.",
        assignedRole: role ?? null,
        allowedRoles: [
          "maker",
          "checker_1",
          "checker_2",
          "governance_admin",
          "compliance_officer",
          "viewer",
        ],
      },
    });
    return;
  }

  req.auth = {
    actorId: user.id,
    actorEmail: user.email ?? "",
    actorRole: role,
  };

  next();
}
