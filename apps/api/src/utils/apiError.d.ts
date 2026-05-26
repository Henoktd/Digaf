import type { Response } from "express";
export declare function sendBadRequest(res: Response, message: string, details?: unknown): Response<any, Record<string, any>>;
export declare function sendNotFound(res: Response, message: string, details?: unknown): Response<any, Record<string, any>>;
export declare function sendConflict(res: Response, message: string, details?: unknown): Response<any, Record<string, any>>;
export declare function sendForbidden(res: Response, message: string, details?: unknown): Response<any, Record<string, any>>;
export declare function sendServerError(res: Response, message: string, error?: unknown): Response<any, Record<string, any>>;
//# sourceMappingURL=apiError.d.ts.map