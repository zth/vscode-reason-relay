import { GraphQLConfig, loadConfig } from "graphql-config";
import { RelayExtension } from "./configUtils";

export async function createGraphQLConfig(
  workspaceBaseDir: string
): Promise<GraphQLConfig | undefined> {
  return loadConfig({
    configName: "relay",
    extensions: [RelayExtension],
    rootDir: workspaceBaseDir,
  });
}
