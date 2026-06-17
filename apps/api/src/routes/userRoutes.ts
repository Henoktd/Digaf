import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { requireRole, type ActorRole } from "../utils/roles";
import {
  sendBadRequest,
  sendForbidden,
  sendNotFound,
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

// GET /api/users — list all auth users with their assigned role
userRoutes.get("/", async (req, res) => {
  const roleCheck = requireRole(req.auth?.actorRole, ["governance_admin"]);
  if (!roleCheck.ok) return sendForbidden(res, roleCheck.message);

  if (!supabaseAdmin) return notConfigured(res);

  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000,
    });

    if (error) {
      return sendServerError(res, "Failed to list users from auth provider", error);
    }

    const users = data.users.map((u) => ({
      id: u.id,
      email: u.email ?? null,
      role: (u.app_metadata?.role as string | undefined) ?? null,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
    }));

    res.json({ data: users });
  } catch (error) {
    return sendServerError(res, "Failed to fetch users", error);
  }
});

// PATCH /api/users/:id/role — assign a governance role to a user
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
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(id, {
      app_metadata: { role },
    });

    if (error) {
      if (error.message?.toLowerCase().includes("not found")) {
        return sendNotFound(res, "User not found");
      }
      return sendServerError(res, "Failed to update user role", error);
    }

    res.json({
      data: {
        id: data.user.id,
        email: data.user.email ?? null,
        role: (data.user.app_metadata?.role as string | undefined) ?? null,
      },
    });
  } catch (error) {
    return sendServerError(res, "Failed to update user role", error);
  }
});
