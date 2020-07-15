import * as prettier from "prettier/standalone";
import * as parserGraphql from "prettier/parser-graphql";
import { window, commands, Range, Selection } from "vscode";

export function prettify(str: string): string {
  return (
    prettier
      .format(str, {
        parser: "graphql",
        plugins: [parserGraphql],
      })
      /**
       * Prettier adds a new line to the output by design.
       * This circumvents that as it messes things up.
       */
      .replace(/^\s+|\s+$/g, "")
  );
}

export const padOperation = (operation: string, indentation: number): string =>
  operation
    .split("\n")
    .map((s: string) => " ".repeat(indentation) + s)
    .join("\n");

const initialWhitespaceRegexp = new RegExp(/^[\s]*(?=[\w])/g);
const endingWhitespaceRegexp = new RegExp(/[\s]*$/g);

export const findOperationPadding = (operation: string): number => {
  const initialWhitespace = (
    operation.match(initialWhitespaceRegexp) || []
  ).pop();
  const firstRelevantLine = (initialWhitespace || "").split("\n").pop();

  return firstRelevantLine ? firstRelevantLine.length : 0;
};

export const restoreOperationPadding = (
  operation: string,
  initialOperation: string
): string => {
  const endingWhitespace = (
    initialOperation.match(endingWhitespaceRegexp) || []
  ).join("");

  return (
    "\n" +
    padOperation(operation, findOperationPadding(initialOperation)) +
    endingWhitespace
  );
};

export function capitalize(str: string): string {
  return str.slice(0, 1).toUpperCase() + str.slice(1);
}

export function uncapitalize(str: string): string {
  return str.slice(0, 1).toLowerCase() + str.slice(1);
}

export function waitFor(time: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

export async function wrapInJsx(
  start: string,
  end: string,
  endSelectionOffset: number
) {
  const textEditor = window.activeTextEditor;

  if (textEditor) {
    const [currentSelection] = textEditor.selections;
    const hasSelectedRange = !currentSelection.start.isEqual(
      currentSelection.end
    );

    if (!hasSelectedRange) {
      await commands.executeCommand("editor.emmet.action.balanceOut");
    }

    const [first] = textEditor.selections;

    if (!first.start.isEqual(first.end)) {
      const selectedRange = new Range(first.start, first.end);
      const text = textEditor.document.getText(selectedRange);

      await textEditor.edit((editBuilder) => {
        editBuilder.replace(selectedRange, `${start}${text}${end}`);
      });

      const endPos = first.start.with(
        undefined,
        first.start.character + endSelectionOffset
      );

      const endSelection = new Selection(endPos, endPos);

      textEditor.selections = [endSelection];
    }
  }
}
