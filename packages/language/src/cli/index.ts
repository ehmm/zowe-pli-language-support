/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright Contributors to the Zowe Project.
 *
 */

import { URI } from "../utils/uri";
import { setFileSystemProvider } from "../workspace/file-system-provider";
import { NodeFileSystemProvider } from "./node-file-system-provider";
import { PluginConfigurationProviderInstance } from "../workspace/plugin-configuration-provider";
import { createCompilationUnit } from "../workspace/compilation-unit";
import { PliLexer } from "../preprocessor/pli-lexer";
import { TextDocument } from "vscode-languageserver-textdocument";
import * as path from "path";
import * as fs from "fs";
import { Token } from "../parser/tokens";

async function main() {
  const args = process.argv.slice(2);
  let inputFile = "";
  let outputFile = "";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "-i" && i + 1 < args.length) {
      inputFile = args[++i];
    } else if (args[i] === "-o" && i + 1 < args.length) {
      outputFile = args[++i];
    }
  }

  if (!inputFile) {
    console.error("Usage: pl1-preprocessor -i <input_file> [-o <output_file>]");
    process.exit(1);
  }

  const absInputPath = path.resolve(inputFile);
  const inputUri = URI.file(absInputPath);
  const workspaceRoot = findWorkspaceRoot(path.dirname(absInputPath));

  // Setup providers
  setFileSystemProvider(new NodeFileSystemProvider());
  await PluginConfigurationProviderInstance.init(workspaceRoot);

  // Read input
  let content = "";
  try {
    content = fs.readFileSync(absInputPath, "utf-8");
  } catch (e) {
    console.error(`Error reading input file: ${e}`);
    process.exit(1);
  }
  const document = TextDocument.create(inputUri.toString(), "pli", 1, content);

  // Create compilation unit
  const unit = await createCompilationUnit(inputUri);

  // Run preprocessor
  try {
    const lexer = new PliLexer();
    const result = await lexer.tokenize(unit, document, inputUri);

    if (result.diagnostics.length > 0) {
      console.error("Diagnostics:");
      for (const diag of result.diagnostics) {
        console.error(`${diag.message} at line ${diag.range.start.line + 1}`);
      }
    }

    // Reconstruct text
    const text = stringifyTokens(result.all);

    if (outputFile) {
      fs.writeFileSync(outputFile, text, "utf-8");
    } else {
      console.log(text);
    }
  } catch (e) {
    console.error(`Error during preprocessing: ${e}`);
    process.exit(1);
  }
}

function findWorkspaceRoot(startDir: string): string {
  let currentDir = startDir;
  const { root } = path.parse(currentDir);
  while (currentDir !== root) {
    if (fs.existsSync(path.join(currentDir, ".pliplugin"))) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }
  return startDir; // Default to input file directory if not found
}

function stringifyTokens(tokens: Token[]): string {
  let text = "";
  for (const token of tokens) {
    text += token.image;
    if (!token.immediateFollow) {
      text += " ";
    }
  }
  return text.trimEnd();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
