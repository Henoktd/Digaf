"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAllowedRole = isAllowedRole;
exports.requireRole = requireRole;
const allowedActorRoles = [
    "maker",
    "checker_1",
    "checker_2",
    "governance_admin",
    "compliance_officer",
    "viewer",
];
function isAllowedRole(role) {
    return (typeof role === "string" &&
        allowedActorRoles.includes(role));
}
function requireRole(role, allowedRoles) {
    const normalizedRole = typeof role === "string" ? role.trim() : "";
    if (!normalizedRole) {
        return {
            ok: false,
            message: "actorRole is required",
        };
    }
    if (!isAllowedRole(normalizedRole)) {
        return {
            ok: false,
            message: "actorRole must be one of: maker, checker_1, checker_2, governance_admin, compliance_officer, viewer",
        };
    }
    if (!allowedRoles.includes(normalizedRole)) {
        return {
            ok: false,
            message: `actorRole '${normalizedRole}' is not authorized for this action`,
        };
    }
    return {
        ok: true,
        role: normalizedRole,
    };
}
//# sourceMappingURL=roles.js.map