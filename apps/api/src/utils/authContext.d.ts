import type { ActorRole } from "./roles";
type AuthSource = "local_prototype" | "entra";
export type AuthenticatedActor = {
    actorId: string;
    actorRole: ActorRole;
    authSource: AuthSource;
    groups: string[];
};
type LocalPrototypeActorInput = {
    actorId?: unknown;
    actorRole?: unknown;
};
export declare function getLocalPrototypeActor(input: LocalPrototypeActorInput): AuthenticatedActor | null;
export declare function mapEntraGroupsToRole(groups: string[]): ActorRole;
export {};
//# sourceMappingURL=authContext.d.ts.map