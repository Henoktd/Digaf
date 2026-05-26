declare const allowedActorRoles: readonly ["maker", "checker_1", "checker_2", "governance_admin", "compliance_officer", "viewer"];
export type ActorRole = (typeof allowedActorRoles)[number];
export declare function isAllowedRole(role: unknown): role is ActorRole;
export declare function requireRole(role: unknown, allowedRoles: ActorRole[]): {
    ok: true;
    role: ActorRole;
} | {
    ok: false;
    message: string;
};
export {};
//# sourceMappingURL=roles.d.ts.map