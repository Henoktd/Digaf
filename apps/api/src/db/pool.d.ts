export declare const pool: {
    query: (text: string, params?: readonly unknown[]) => Promise<any>;
    connect: () => Promise<{
        query: (text: string, params?: readonly unknown[]) => Promise<any>;
        release: () => void;
    }>;
};
//# sourceMappingURL=pool.d.ts.map