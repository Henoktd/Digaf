import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { requireRole, type ActorRole } from "../utils/roles";
import {
  sendBadRequest,
  sendForbidden,
  sendServerError,
} from "../utils/apiError";

export const userRoutes = Router();

const ALLOWED_ROLES: ActorRole[] = [
  "governance_admin",
  "maker",
  "checker_1",
  "checker_2",
  "compliance_officer",
  "viewer",
];

function makeSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const supabaseAdmin = makeSupabaseAdmin();

function notConfigured(res: Parameters<typeof sendServerError>[0]) {
  return sendServerError(
    res,
    "User management requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
    null
  );
}

// GET /api/users — list all auth users via RPC (avoids Admin API bug)
userRoutes.get("/", async (req, res) => {
  const roleCheck = requireRole(req.auth?.actorRole, ["governance_admin"]);
  if (!roleCheck.ok) return sendForbidden(res, roleCheck.message);

  if (!supabaseAdmin) return notConfigured(res);

  try {
    const { data, error } = await supabaseAdmin.rpc("list_auth_users");

    if (error) {
      return sendServerError(res, "Failed to list users", error);
    }

    res.json({ data: data ?? [] });
  } catch (error) {
    return sendServerError(res, "Failed to fetch users", error);
  }
});

// PATCH /api/users/:id/role — assign a governance role to a user via RPC
userRoutes.patch("/:id/role", async (req, res) => {
  const roleCheck = requireRole(req.auth?.actorRole, ["governance_admin"]);
  if (!roleCheck.ok) return sendForbidden(res, roleCheck.message);

  if (!supabaseAdmin) return notConfigured(res);

  const { id } = req.params;
  const { role } = req.body ?? {};

  if (!role || typeof role !== "string") {
    return sendBadRequest(res, "role is required");
  }
  if (!ALLOWED_ROLES.includes(role as ActorRole)) {
    return sendBadRequest(
      res,
      `role must be one of: ${ALLOWED_ROLES.join(", ")}`
    );
  }

  try {
    const { error } = await supabaseAdmin.rpc("set_user_role", {
      target_user_id: id,
      new_role: role,
    });

    if (error) {
      return sendServerError(res, "Failed to update user role", error);
    }

    res.json({ data: { id, role } });
  } catch (error) {
    return sendServerError(res, "Failed to update user role", error);
  }
});
