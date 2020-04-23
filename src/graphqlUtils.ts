import {
  Source,
  getLocation,
  GraphQLObjectType,
  GraphQLField,
  ValueNode,
  ArgumentNode,
  SelectionNode,
  SelectionSetNode,
  FieldNode,
  ObjectFieldNode,
  VariableDefinitionNode,
  OperationDefinitionNode,
  DirectiveNode,
  Location,
  FragmentDefinitionNode,
  FragmentSpreadNode,
  parse,
} from "graphql";

import { Position } from "vscode";
import { State } from "graphql-language-service-types";

export interface NodeWithLoc {
  loc?: Location | undefined;
}

export type NodesWithDirectives =
  | FragmentDefinitionNode
  | FieldNode
  | FragmentSpreadNode
  | OperationDefinitionNode;

export function getStateName(state: State): string | undefined {
  switch (state.kind) {
    case "OperationDefinition":
    case "FragmentDefinition":
    case "AliasedField":
    case "Field":
      return state.name ? state.name : undefined;
  }
}

export function runOnNodeAtPos<T extends NodeWithLoc>(
  source: Source,
  node: T,
  pos: Position,
  fn: (node: T) => T | undefined
) {
  const { loc } = node;

  if (!loc) {
    return;
  }

  const nodeLoc = getLocation(source, loc.start);

  if (nodeLoc.line === pos.line + 1) {
    return fn(node);
  }
}

export function getFirstField(
  obj: GraphQLObjectType
): GraphQLField<any, any, { [key: string]: any }> {
  const fields = Object.values(obj.getFields());
  const hasIdField = fields.find((v) => v.name === "id");
  const firstField = hasIdField ? hasIdField : fields[0];

  return firstField;
}

export function makeArgument(name: string, value: ValueNode): ArgumentNode {
  return {
    kind: "Argument",
    name: {
      kind: "Name",
      value: name,
    },
    value,
  };
}

export function makeSelectionSet(
  selections: SelectionNode[]
): SelectionSetNode {
  return {
    kind: "SelectionSet",
    selections,
  };
}

export function makeFieldSelection(
  name: string,
  selections?: SelectionNode[]
): FieldNode {
  return {
    kind: "Field",
    name: {
      kind: "Name",
      value: name,
    },
    selectionSet: selections != null ? makeSelectionSet(selections) : undefined,
  };
}

export function makeArgumentDefinitionVariable(
  name: string,
  type: string,
  defaultValue?: string | undefined
): ArgumentNode {
  const fields: ObjectFieldNode[] = [
    {
      kind: "ObjectField",
      name: {
        kind: "Name",
        value: "type",
      },
      value: {
        kind: "StringValue",
        value: type,
      },
    },
  ];

  if (defaultValue != null) {
    fields.push({
      kind: "ObjectField",
      name: {
        kind: "Name",
        value: "defaultValue",
      },
      value: {
        kind: "IntValue",
        value: defaultValue,
      },
    });
  }

  return {
    kind: "Argument",
    name: {
      kind: "Name",
      value: name,
    },
    value: {
      kind: "ObjectValue",
      fields,
    },
  };
}

export function makeVariableDefinitionNode(
  name: string,
  value: string
): VariableDefinitionNode | undefined {
  const ast = parse(`mutation($${name}: ${value}) { id }`);
  const firstDef = ast.definitions[0];

  if (
    firstDef &&
    firstDef.kind === "OperationDefinition" &&
    firstDef.variableDefinitions
  ) {
    return firstDef.variableDefinitions.find(
      (v) => v.variable.name.value === name
    );
  }
}

export function findPath(state: State): string[] {
  const rootName = getStateName(state);

  const path: string[] = rootName ? [rootName] : [];

  let prevState = state.prevState;

  while (prevState) {
    const name = getStateName(prevState);
    if (name) {
      path.push(name);
    }

    prevState = prevState.prevState;
  }

  return path;
}

export function nodeHasDirective(
  node: NodesWithDirectives,
  name: string,
  hasArgs?: (args: readonly ArgumentNode[]) => boolean
): boolean {
  const directive = node.directives
    ? node.directives.find((d) => d.name.value === name)
    : undefined;

  if (!directive) {
    return false;
  }

  if (hasArgs) {
    return directive.arguments ? hasArgs(directive.arguments) : false;
  }

  return true;
}

export function nodeHasVariable(
  node: OperationDefinitionNode,
  name: string
): boolean {
  return node.variableDefinitions
    ? !!node.variableDefinitions.find((v) => v.variable.name.value === name)
    : false;
}

export function addDirectiveToNode<T extends NodesWithDirectives>(
  node: T,
  name: string,
  args: ArgumentNode[]
): T {
  let directives = node.directives || [];

  const existingDirectiveNode: DirectiveNode | undefined = directives.find(
    (d) => d.name.value === name
  );

  let directiveNode: DirectiveNode = existingDirectiveNode || {
    kind: "Directive",
    name: {
      kind: "Name",
      value: name,
    },
    arguments: args,
  };

  if (existingDirectiveNode) {
    directiveNode = {
      ...directiveNode,
      arguments: [...(existingDirectiveNode.arguments || []), ...args].reduce(
        (acc: ArgumentNode[], curr) => {
          const asNewArg = args.find((a) => a.name === curr.name);

          if (!acc.find((a) => a.name === curr.name)) {
            acc.push(asNewArg ? asNewArg : curr);
          }

          return acc;
        },
        []
      ),
    };
  }

  return {
    ...node,
    directives: [
      ...directives.filter((d) => d.name !== directiveNode.name),
      directiveNode,
    ],
  };
}
