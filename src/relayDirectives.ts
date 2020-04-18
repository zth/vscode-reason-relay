import { parse, DirectiveDefinitionNode } from "graphql";

const directives = parse(`
directive @refetchable(queryName: String!) on FRAGMENT_DEFINITION
directive @arguments on FRAGMENT_SPREAD
directive @argumentDefinitions on FRAGMENT_DEFINITION
directive @inline on FRAGMENT_DEFINITION
directive @relay_test_operation on QUERY | MUTATION | SUBSCRIPTION
directive @raw_response_type on QUERY | MUTATION | SUBSCRIPTION
directive @relay(
  # Marks a fragment as being backed by a GraphQLList.
  plural: Boolean,
  # Marks a fragment spread which should be unmasked if provided false
  mask: Boolean = true,
) on FRAGMENT_DEFINITION | FRAGMENT_SPREAD
directive @match(key: String) on FIELD
directive @module(name: String!) on FRAGMENT_SPREAD        
directive @connection(
  key: String!
  filters: [String]
  handler: String
  dynamicKey_UNSTABLE: String
) on FIELD
directive @stream_connection(
  key: String!
  filters: [String]
  handler: String
  label: String!
  initial_count: Int!
  if: Boolean = true
  use_customized_batch: Boolean = false
  dynamicKey_UNSTABLE: String
) on FIELD
`);

export const directiveNodes: DirectiveDefinitionNode[] = directives.definitions.reduce(
  (acc: DirectiveDefinitionNode[], curr) => {
    if (curr.kind === "DirectiveDefinition") {
      acc.push(curr);
    }

    return acc;
  },
  []
);
