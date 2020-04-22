import { GraphQLConfig, loadConfigSync } from "graphql-config";
import { RelayDirectivesExtension } from "./configUtils";

export function createGraphQLConfig(
  workspaceBaseDir: string
): GraphQLConfig | undefined {
  const config = loadConfigSync({
    configName: "relay",
    extensions: [RelayDirectivesExtension],
    rootDir: workspaceBaseDir,
  });

  return config;
}
