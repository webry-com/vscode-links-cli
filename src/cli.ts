#!/usr/bin/env node

import path from "path";
import fs from "fs";
import { helpAndExit, ParsedVSCodeLinksConfig, validateConfig, VSCodeDocumentLink } from "./utils/utils.js";
import { minimatch } from "minimatch";

const workspaceFolder = process.cwd();
if (process.argv.length <= 2) {
  helpAndExit();
}

let fileContents = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  fileContents += chunk.toString("utf8");
});
process.stdin.on("end", () => {
  const [cliNode, cliPath, ...cliArgs] = process.argv;
  const action = cliArgs[0];

  // cli run -c config.js -f file.js
  if (action === "run") {
    const indexOfConfig = cliArgs.indexOf("-c");
    const indexOfFile = cliArgs.indexOf("-f");
    const configPath = indexOfConfig > -1 ? cliArgs[indexOfConfig + 1] : undefined;
    const filePath = indexOfFile > -1 ? cliArgs[indexOfFile + 1] : undefined;
    if (configPath == null || filePath == null) {
      helpAndExit();
    }

    const absoluteConfigPath = path.resolve(workspaceFolder, configPath);
    if (!fs.existsSync(absoluteConfigPath)) {
      console.error(`Config file ${configPath} does not exist`);
      process.exit(1);
    }

    const configUrl = new URL(`file://${absoluteConfigPath}`);
    configUrl.searchParams.append("t", Date.now().toString());

    import(configUrl.href).then((configModule) => {
      if (!configModule.default) {
        console.error(`Config file ${configPath} does not export a default object`);
        process.exit(1);
      }

      const config = configModule.default;
      if (!validateConfig(config)) {
        process.exit(1);
      }

      config.links = config.links.filter((link) => {
        const relativePath = path.relative(workspaceFolder, filePath).replace(/\\/g, "/");
        const isIncluded = link.include.length && link.include.some((pattern) => minimatch(relativePath, pattern));
        const isExcluded =
          link.exclude && link.exclude.length && link.exclude.some((pattern) => minimatch(relativePath, pattern));
        if (!isIncluded || isExcluded) {
          return false;
        }

        return true;
      });

      const links = runOnFile(config, fileContents);
      console.log(JSON.stringify(links, null, 2));
      process.exit(0);
    });
  } else {
    helpAndExit();
  }
});

function runOnFile(config: ParsedVSCodeLinksConfig, contents: string) {
  const links: VSCodeDocumentLink[] = [];
  for (const link of config.links) {
    if ("pattern" in link) {
      for (const regEx of link.pattern) {
        let match: RegExpExecArray | null;
        while ((match = regEx.exec(contents))) {
          const range = {
            start: match.index,
            end: match.index + match[0].length,
          };

          if (match.groups && "link" in match.groups) {
            const linkText = match.groups.link;
            range.start = match.index + match[0].indexOf(linkText);
            range.end = match.index + match[0].indexOf(linkText) + linkText.length;
          }

          const linkText = contents.substring(range.start, range.end);
          const result = link.handle({
            linkText,
            workspacePath: workspaceFolder.replace(/\\/g, "/"),
          });
          const validHandlerRespose =
            result && typeof result === "object" && "target" in result && typeof result.target === "string";
          if (!validHandlerRespose) {
            continue;
          }

          links.push({
            ...result,
            range: [range.start, range.end],
          });
        }
      }
    }
  }
  return links;
}
