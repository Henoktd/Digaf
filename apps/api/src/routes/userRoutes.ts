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

function getFrontendBaseUrl() {
  return (
    process.env.FRONTEND_PUBLIC_BASE_URL || "http://localhost:3000"
  ).replace(/\/+$/, "");
}

// Where invite/reset emails should land after Supabase exchanges the link's
// code for a session — our callback route, which then forwards to the
// password-set page. Without this, Supabase falls back to its dashboard
// "Site URL", which is why these links were landing on /login with no way
// to set a password.
function buildAuthRedirectTo() {
  return `${getFrontendBaseUrl()}/auth/callback?next=${encodeURIComponent("/auth/update-password")}`;
}

function notConfigured(res: Parameters<typeof sendServerError>[0]) {
  return sendServerError(
    res,
    "User management requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
    null
  );
}

// GET /api/users — list all auth users via RPC (avoids Admin API listUsers bug)
userRoutes.get("/", async (req, res) => {
  const roleCheck = requireRole(req.auth?.actorRole, ["governance_admin"]);
  if (!roleCheck.ok) return sendForbidden(res, roleCheck.message);

  if (!supabaseAdmin) return notConfigured(res);

  try {
    const { data, error } = await supabaseAdmin.rpc("list_auth_users");
    if (error) return sendServerError(res, "Failed to list users", error);
    res.json({ data: data ?? [] });
  } catch (error) {
    return sendServerError(res, "Failed to fetch users", error);
  }
});

// POST /api/users/invite — invite a new user by email and set their role
userRoutes.post("/invite", async (req, res) => {
  const roleCheck = requireRole(req.auth?.actorRole, ["governance_admin"]);
  if (!roleCheck.ok) return sendForbidden(res, roleCheck.message);

  if (!supabaseAdmin) return notConfigured(res);

  const { email, role } = req.body ?? {};
  if (!email || typeof email !== "string") return sendBadRequest(res, "email is required");
  if (!role || typeof role !== "string") return sendBadRequest(res, "role is required");
  if (!ALLOWED_ROLES.includes(role as ActorRole)) {
    return sendBadRequest(res, `role must be one of: ${ALLOWED_ROLES.join(", ")}`);
  }

  try {
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: buildAuthRedirectTo(),
    });
    if (error) return sendServerError(res, "Failed to invite user", error);

    // Set governance role immediately after invite creation
    const { error: roleError } = await supabaseAdmin.rpc("set_user_role", {
      target_user_id: data.user.id,
      new_role: role,
    });
    if (roleError) {
      // User was created but role failed — not fatal, admin can change role manually
      console.error("set_user_role after invite failed:", roleError);
    }

    res.json({ data: { id: data.user.id, email: data.user.email ?? null, role } });
  } catch (error) {
    return sendServerError(res, "Failed to invite user", error);
  }
});

// PATCH /api/users/:id/role — assign a governance role to a user via RPC
userRoutes.patch("/:id/role", async (req, res) => {
  const roleCheck = requireRole(req.auth?.actorRole, ["governance_admin"]);
  if (!roleCheck.ok) return sendForbidden(res, roleCheck.message);

  if (!supabaseAdmin) return notConfigured(res);

  const { id } = req.params;
  const { role } = req.body ?? {};

  if (!role || typeof role !== "string") return sendBadRequest(res, "role is required");
  if (!ALLOWED_ROLES.includes(role as ActorRole)) {
    return sendBadRequest(res, `role must be one of: ${ALLOWED_ROLES.join(", ")}`);
  }

  try {
    const { error } = await supabaseAdmin.rpc("set_user_role", {
      target_user_id: id,
      new_role: role,
    });
    if (error) return sendServerError(res, "Failed to update user role", error);
    res.json({ data: { id, role } });
  } catch (error) {
    return sendServerError(res, "Failed to update user role", error);
  }
});

// PATCH /api/users/:id/password — admin sets password directly via RPC (avoids Admin API bug)
userRoutes.patch("/:id/password", async (req, res) => {
  const roleCheck = requireRole(req.auth?.actorRole, ["governance_admin"]);
  if (!roleCheck.ok) return sendForbidden(res, roleCheck.message);

  if (!supabaseAdmin) return notConfigured(res);

  const { id } = req.params;
  const { password } = req.body ?? {};

  if (!password || typeof password !== "string") return sendBadRequest(res, "password is required");
  if (password.length < 8) return sendBadRequest(res, "password must be at least 8 characters");

  try {
    const { error } = await supabaseAdmin.rpc("set_user_password", {
      target_user_id: id,
      new_password: password,
    });
    if (error) return sendServerError(res, "Failed to set password", error);
    res.json({ data: { id, passwordSet: true } });
  } catch (error) {
    return sendServerError(res, "Failed to set password", error);
  }
});

// POST /api/users/:id/send-reset — send a password reset email to a user
userRoutes.post("/:id/send-reset", async (req, res) => {
  const roleCheck = requireRole(req.auth?.actorRole, ["governance_admin"]);
  if (!roleCheck.ok) return sendForbidden(res, roleCheck.message);

  if (!supabaseAdmin) return notConfigured(res);

  const { email } = req.body ?? {};
  if (!email || typeof email !== "string") return sendBadRequest(res, "email is required");

  try {
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: buildAuthRedirectTo(),
    });
    if (error) return sendServerError(res, "Failed to send password reset email", error);
    res.json({ data: { sent: true } });
  } catch (error) {
    return sendServerError(res, "Failed to send password reset email", error);
  }
});

// DELETE /api/users/:id — permanently remove a user via RPC (avoids Admin API bug)
userRoutes.delete("/:id", async (req, res) => {
  const roleCheck = requireRole(req.auth?.actorRole, ["governance_admin"]);
  if (!roleCheck.ok) return sendForbidden(res, roleCheck.message);

  if (!supabaseAdmin) return notConfigured(res);

  const { id } = req.params;

  try {
    const { error } = await supabaseAdmin.rpc("delete_auth_user", {
      target_user_id: id,
    });
    if (error) return sendServerError(res, "Failed to delete user", error);
    res.json({ data: { id, deleted: true } });
  } catch (error) {
    return sendServerError(res, "Failed to delete user", error);
  }
});
