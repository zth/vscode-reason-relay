import { GraphQLConfig, loadConfigSync } from "graphql-config";
import { RelayDirectivesExtension } from "./configUtils";

export function createGraphQLConfig(
  workspaceBaseDir: string
): GraphQLConfig | undefined {
  return loadConfigSync({
    configName: "relay",
    extensions: [RelayDirectivesExtension],
    rootDir: workspaceBaseDir,
  });
}
