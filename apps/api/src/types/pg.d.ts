declare module "pg" {
  const pg: {
    Pool: new (config: { connectionString: string }) => {
      query: (text: string, params?: readonly unknown[]) => Promise<any>;
      connect: () => Promise<{
        query: (text: string, params?: readonly unknown[]) => Promise<any>;
        release: () => void;
      }>;
    };
  };

  export default pg;
}
