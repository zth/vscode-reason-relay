import { GraphQLConfig, loadConfigSync } from "graphql-config";
import { RelayDirectivesExtension } from "./configUtils";
import * as path from "path";

export function createGraphQLConfig(
  workspaceBaseDir: string,
  includeValidationRules?: boolean
): GraphQLConfig | undefined {
  const config = loadConfigSync({
    configName: "relay",
    extensions: [
      RelayDirectivesExtension,
      () => ({
        name: "customValidationRules",
      }),
    ],
    rootDir: workspaceBaseDir,
  });

  if (includeValidationRules) {
    const project = config.getProject();
    project.extensions["customValidationRules"] = path.resolve(
      path.join(__dirname, "../build/validationRules.js")
    );
  }

  return config;
}
