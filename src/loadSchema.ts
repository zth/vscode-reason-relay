import { GraphQLSchema } from "graphql";
import { workspace, window, ProgressLocation } from "vscode";
import { createGraphQLConfig } from "./graphqlConfig";
import { GraphQLConfig } from "graphql-config";
import * as path from "path";

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

let loadSchemaCachePromise: Promise<SchemaCache | undefined> | undefined;

export function getSchemaCacheForWorkspace(
  workspaceBaseDir: string
): Promise<SchemaCache | undefined> {
  if (loadSchemaCachePromise) {
    return loadSchemaCachePromise;
  }

  loadSchemaCachePromise = new Promise(async (resolve) => {
    const fromCache = cache[workspaceBaseDir];

    if (fromCache) {
      loadSchemaCachePromise = undefined;
      return resolve(fromCache);
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
      loadSchemaCachePromise = undefined;
      return;
    }

    const entry: SchemaCache = {
      config,
      schema,
    };

    cache[workspaceBaseDir] = entry;
    loadSchemaCachePromise = undefined;

    resolve(entry);
  });

  return loadSchemaCachePromise;
}

export async function loadFullSchema(): Promise<GraphQLSchema | undefined> {
  const workspaceRoot = getCurrentWorkspaceRoot();

  if (!workspaceRoot) {
    return;
  }

  const cacheEntry = await getSchemaCacheForWorkspace(workspaceRoot);
  return cacheEntry ? cacheEntry.schema : undefined;
}

export async function loadGraphQLConfig(): Promise<GraphQLConfig | undefined> {
  const workspaceRoot = getCurrentWorkspaceRoot();

  if (!workspaceRoot) {
    return;
  }

  const cacheEntry = await getSchemaCacheForWorkspace(workspaceRoot);
  return cacheEntry ? cacheEntry.config : undefined;
}

export type RelayConfig = {
  src: string;
  schema: string;
  artifactDirectory: string;
};

export async function loadRelayConfig(): Promise<RelayConfig | undefined> {
  const config = await loadGraphQLConfig();
  if (config) {
    let relayConfig: RelayConfig | undefined;
    try {
      const configFilePath = config.getProject().filepath;
      const rawRelayConfig = require(config.getProject().filepath);

      relayConfig = {
        src: path.resolve(path.dirname(configFilePath), rawRelayConfig.src),
        schema: path.resolve(
          path.dirname(configFilePath),
          rawRelayConfig.schema
        ),
        artifactDirectory: path.resolve(
          path.dirname(configFilePath),
          rawRelayConfig.artifactDirectory
        ),
      };
    } catch (e) {
      return;
    }

    return relayConfig;
  }
}
