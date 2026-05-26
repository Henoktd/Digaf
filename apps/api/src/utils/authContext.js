"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocalPrototypeActor = getLocalPrototypeActor;
exports.mapEntraGroupsToRole = mapEntraGroupsToRole;
const roles_1 = require("./roles");
const entraGroupRoleMappings = [
    {
        groupName: "Digaf-Governance-Admins",
        role: "governance_admin",
    },
    {
        groupName: "Digaf-Compliance-Officers",
        role: "compliance_officer",
    },
    {
        groupName: "Digaf-Governance-Checker2",
        role: "checker_2",
    },
    {
        groupName: "Digaf-Governance-Checker1",
        role: "checker_1",
    },
    {
        groupName: "Digaf-Governance-Makers",
        role: "maker",
    },
    {
        groupName: "Digaf-Governance-Viewers",
        role: "viewer",
    },
];
// Local prototype only. Production actor context must come from trusted
// authenticated identity claims, not from client-controlled request bodies.
function getLocalPrototypeActor(input) {
    const actorId = typeof input.actorId === "string" ? input.actorId.trim() : "";
    const actorRole = typeof input.actorRole === "string" ? input.actorRole.trim() : "";
    if (!actorId || !(0, roles_1.isAllowedRole)(actorRole)) {
        return null;
    }
    return {
        actorId,
        actorRole,
        authSource: "local_prototype",
        groups: [],
    };
}
function mapEntraGroupsToRole(groups) {
    const normalizedGroups = new Set(groups.map((group) => group.trim()));
    for (const mapping of entraGroupRoleMappings) {
        if (normalizedGroups.has(mapping.groupName)) {
            return mapping.role;
        }
    }
    return "viewer";
}
//# sourceMappingURL=authContext.js.map