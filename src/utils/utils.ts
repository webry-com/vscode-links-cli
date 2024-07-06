export type CLIDocumentLink = {
  range: [number, number];
  target: string;
  tooltip?: string;
  jumpPattern?:
    | {
        literal: string;
      }
    | {
        pattern: string;
        flags: string;
      };
};

export type Config = {
  version?: "1";
  /**
   * Specify the links to be handled by the extension.
   */
  links: Array<{
    /**
     * Include a glob string or array of glob strings that match the files in which to
     * search for links.
     */
    include: string | Array<string>;
    /**
     * Exclude a glob string or array of glob strings that match the files in which to
     * NOT search for links. This setting overrides the `include` setting.
     *
     * @default {[]}
     */
    exclude?: string | Array<string>;
    /**
     * The pattern to use when searching for links. If you use a RegExp you can specify a named capturing
     * group to define the hitbox of the link. Example: `/text before that is not a link(?<link>https://example.com)text after that is not a link/g`.
     */
    pattern: string | RegExp | RegExp[];
    /**
     * This function is called when the extension finds a link using the `pattern` property. From this function
     * you can return an object that specifies what the link opens (files, http links), what it should show when
     * you hover over it (tooltip), and (if you link to a file) where it should jump to (jumpPattern).
     *
     * @param options The information the extension gives you to handle the link.
     * @returns
     */
    handle: (options: { linkText: string }) => {
      /**
       * The file or http link to open. Note that on windows use `file:///` instead of `file://`.
       */
      target: string;
      /**
       * The text to show when you hover over the link.
       */
      tooltip?: string;
      /**
       * The regex pattern or sub string to jump to within the target file.
       */
      jumpPattern?: RegExp | string;
    };
  }>;
};

export type ParsedVSCodeLinksConfig = {
  links: Array<{
    include: Array<string>;
    exclude: Array<string>;
    handle: (options: { linkText: string }) => {
      target: string;
      tooltip?: string;
      jumpPattern?: RegExp | string;
    };
    pattern: RegExp[];
  }>;
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
}
