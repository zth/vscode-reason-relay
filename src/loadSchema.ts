import { GraphQLSchema } from "graphql";
import { workspace, window, ProgressLocation } from "vscode";
import { createGraphQLConfig } from "./graphqlConfig";
import { GraphQLConfig } from "graphql-config";

interface SchemaCache {
  config: GraphQLConfig;
  schema: GraphQLSchema;
}

interface WorkspaceSchemaCache {
  [id: string]: SchemaCache | undefined;
}

const cache: WorkspaceSchemaCache = {};

export const cacheControl = {
  async refresh(workspaceBaseDir: string) {
    const config = createGraphQLConfig(workspaceBaseDir);

    if (!config) {
      return false;
    }

    const entry: SchemaCache = {
      config,
      schema: await config.getProject().getSchema(),
    };

    cache[workspaceBaseDir] = entry;

    return true;
  },
  async get(workspaceBaseDir: string) {
    if (!cache[workspaceBaseDir]) {
      await this.refresh(workspaceBaseDir);
    }

    return cache[workspaceBaseDir];
  },
  remove(workspaceBaseDir: string) {
    cache[workspaceBaseDir] = undefined;
  },
};

export function getCurrentWorkspaceRoot(): string | undefined {
  if (workspace.workspaceFolders) {
    return workspace.workspaceFolders[0].uri.fsPath;
  }
}

let loadSchemaPromise: Promise<GraphQLSchema | undefined> | undefined;

export function getSchemaForWorkspace(
  workspaceBaseDir: string
): Promise<GraphQLSchema | undefined> {
  if (loadSchemaPromise) {
    return loadSchemaPromise;
  }

  loadSchemaPromise = new Promise(async (resolve) => {
    const fromCache = cache[workspaceBaseDir];

    if (fromCache) {
      return resolve(fromCache.schema);
    }

    let schema: GraphQLSchema | undefined;
    let config: GraphQLConfig | undefined;

    await window.withProgress(
      {
        location: ProgressLocation.Notification,
        title: "Loading your GraphQL schema...",
        cancellable: false,
      },
      async () => {
        config = await createGraphQLConfig(workspaceBaseDir);

        if (!config) {
          return;
        }

        schema = await config.getProject().getSchema();
      }
    );

    if (!config || !schema) {
      loadSchemaPromise = undefined;
      return;
    }

    const entry: SchemaCache = {
      config,
      schema,
    };

    cache[workspaceBaseDir] = entry;
    loadSchemaPromise = undefined;

    resolve(entry.schema);
  });

  return loadSchemaPromise;
}

export async function loadFullSchema(): Promise<GraphQLSchema | undefined> {
  const workspaceRoot = getCurrentWorkspaceRoot();

  if (!workspaceRoot) {
    return;
  }

  return getSchemaForWorkspace(workspaceRoot);
}
