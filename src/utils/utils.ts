export type VSCodeDocumentLink = {
  range: [number, number];
  target: string;
  tooltip?: string;
};

export type VSCodeLinksConfig = {
  links: Array<
    {
      include: string | Array<string>;
      exclude?: string | Array<string>;
      handle: (options: {
        linkText: string;
        filePath: string;
        file: (path: string) => string;
        workspacePath: string;
        workspaceFile: (path: string) => string;
      }) => {
        target: string;
        tooltip?: string;
      };
    } & (
      | { pattern: string | RegExp | RegExp[] }
      | {
          customPattern: ({ documentText }: { documentText: string }) => undefined | null | [number, number];
        }
    )
  >;
};

export type ParsedVSCodeLinksConfig = {
  links: Array<
    {
      include: Array<string>;
      exclude: Array<string>;
      handle: (options: { linkText: string; workspacePath: string }) => {
        target: string;
        tooltip?: string;
      };
    } & (
      | { pattern: RegExp[] }
      | {
          customPattern: ({ documentText }: { documentText: string }) => undefined | null | [number, number];
        }
    )
  >;
};

export function validateConfig(config: any): config is ParsedVSCodeLinksConfig {
  const isObject = typeof config === "object" && config !== null && !Array.isArray(config);
  if (!isObject) {
    console.error("Your config is not an object");
    return false;
  }

  if (!Array.isArray(config.links)) {
    console.error("Your config is missing the links property");
    return false;
  }

  for (const link of config.links) {
    if (typeof link !== "object" && link !== null) {
      console.error("Config: One of your links is not an object.");
      return false;
    }

    if (typeof link.include !== "string" && !Array.isArray(link.include)) {
      console.error("Config: One of your links is missing the include property.");
      return false;
    }

    if (typeof link.include === "string") {
      link.include = [link.include];
    }

    if (typeof link.exclude === "string") {
      link.exclude = [link.exclude];
    }

    if (typeof link.handle !== "function") {
      console.error("Config: One of your links is missing the handle property.");
      return false;
    }

    const validExclude =
      typeof link.exclude === "string" ||
      (Array.isArray(link.exclude) && link.exclude.every((e: any) => typeof e === "string"));
    if (!validExclude) {
      link.exclude = [];
    }

    if (typeof link.pattern === "undefined" && typeof link.customPattern === "undefined") {
      console.error("Config: You need to specify either pattern or customPattern.");
      return false;
    }

    if (link.pattern != null) {
      const validPattern =
        typeof link.pattern === "string" || Array.isArray(link.pattern) || link.pattern instanceof RegExp;
      if (!validPattern) {
        console.error("Config: One of your links is missing the pattern property.");
        return false;
      }

      link.pattern =
        typeof link.pattern === "string"
          ? [new RegExp(link.pattern, "g")]
          : link.pattern instanceof RegExp
          ? [link.pattern]
          : link.pattern;
    }
  }

  return true;
}

export function helpAndExit(): never {
  help();
  process.exit(1);
}

export function help() {
  console.error("Usage: vscode-links-cli <action> [options]");
  console.error("");
  console.error("Actions:");
  console.error("  run: Extract links from a file based on the given configuration and file.");
  console.error("       Example: vscode-links-cli run -c ./config.json -f ./test.md");
  console.error("");
  console.error("  config: Create a new configuration file.");
  console.error("       Example: vscode-links-cli config -f ./config.json");
}
