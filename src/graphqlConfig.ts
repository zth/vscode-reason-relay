import { GraphQLConfig, loadConfigSync } from "graphql-config";
import { RelayExtension } from "./configUtils";

export function createGraphQLConfig(
  workspaceBaseDir: string
): GraphQLConfig | undefined {
  return loadConfigSync({
    configName: "relay",
    extensions: [RelayExtension],
    rootDir: workspaceBaseDir,
  });
}
