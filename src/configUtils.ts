import { GraphQLExtensionDeclaration } from "graphql-config";
import { directiveNodes } from "./relayDirectives";

export const RelayExtension: GraphQLExtensionDeclaration = (api) => {
  api.loaders.schema.use((document) => ({
    ...document,
    definitions: [...document.definitions, ...directiveNodes],
  }));
  return {
    name: "VScodeReasonML",
  };
};
