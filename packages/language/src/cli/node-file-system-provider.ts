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

import * as fs from "fs/promises";
import { URI } from "../utils/uri";
import {
  FileSystemProvider,
  SearchOptions,
  Stats,
  isPathSearch,
} from "../workspace/file-system-provider";

export class NodeFileSystemProvider implements FileSystemProvider {
  async readFile(uri: URI): Promise<string | undefined> {
    try {
      return await fs.readFile(uri.fsPath, "utf-8");
    } catch (error) {
      return undefined;
    }
  }

  async readDir(uri: URI): Promise<string[]> {
    try {
      return await fs.readdir(uri.fsPath);
    } catch (error) {
      return [];
    }
  }

  async fileExists(uri: URI): Promise<boolean> {
    try {
      await fs.access(uri.fsPath);
      return true;
    } catch {
      return false;
    }
  }

  async writeFile(uri: URI, value: string): Promise<void> {
    await fs.writeFile(uri.fsPath, value, "utf-8");
  }

  async deleteFile(uri: URI): Promise<void> {
    try {
      await fs.unlink(uri.fsPath);
    } catch {
      // Ignore error if file doesn't exist
    }
  }

  async search(options: SearchOptions): Promise<URI | undefined> {
    if (isPathSearch(options)) {
      const filePath = options.path.fsPath;
      if (await this.fileExists(options.path)) {
        return options.path;
      }

      if (!options.global) {
        for (const ext of options.extensions) {
          const fullPath = filePath + (ext.startsWith(".") ? ext : `.${ext}`);
          const uri = URI.file(fullPath);
          if (await this.fileExists(uri)) {
            return uri;
          }
        }
      } else {
        // Global search is not implemented for CLI
        // It would require scanning the whole workspace/filesystem which is inefficient without an index
        return undefined;
      }
    } else {
      // MemberSearchInDir
      // Search for files ending with (member) in the directory
      const dirPath = options.dirPath.fsPath;
      const memberPart = `(${options.member})`.toLowerCase();

      try {
        const files = await fs.readdir(dirPath);
        // We need to sort to ensure consistent behavior with VFS (depth 1st & alphabetically)
        // But here depth is 1 (readdir is shallow). So just alphabetical.
        files.sort();

        for (const file of files) {
          if (file.toLowerCase().endsWith(memberPart)) {
            return URI.file(pathJoin(dirPath, file));
          }
        }
      } catch {
        return undefined;
      }
    }
    return undefined;
  }

  async stat(uri: URI): Promise<Stats> {
    try {
      const stats = await fs.stat(uri.fsPath);
      return {
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
      };
    } catch {
      return {
        isFile: false,
        isDirectory: false,
      };
    }
  }
}

function pathJoin(p1: string, p2: string): string {
  // Simple path join that handles basic separators
  const sep = p1.includes("\\") ? "\\" : "/";
  return p1.endsWith(sep) ? p1 + p2 : p1 + sep + p2;
}
