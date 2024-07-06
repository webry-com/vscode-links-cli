/** @type {import("./build/module/index").Config} */
export default {
  version: "1",
  links: [
    {
      include: "**/*",
      pattern: /["'`](?<link>api(\.[^"'`]+)+)["'`]/g, // Clickable: "api.asd.asd"
      handle: ({ linkText }) => {
        const parts = linkText.split(".");
        const apiName = parts.pop();
        return {
          target: workspace`${parts.join("/")}.py`,
          tooltip: `Open python file for the "${apiName}" API.`,
          jumpPattern: "www",
        };
      },
    },
  ],
};
