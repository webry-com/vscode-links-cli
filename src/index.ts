export { Config } from "./utils/utils";

export function workspace(strings: string[], ...values: string[]): string {
  const filePrefix =
    (
      {
        win32: "file:///",
      } as Record<string, string>
    )[process.platform] || "file://";
  const workspace = process.cwd().replace(/\\/g, "/");

  let builtString = "";
  strings.forEach((string, i) => {
    builtString += string + (values[i] || "");
  });
  const filePath = `${workspace}/${builtString}`.replace(/[\\\/]+/g, "/");
  return `${filePrefix}${filePath}`;
}

export function file(strings: string[], ...values: string[]): string {
  const filePrefix =
    (
      {
        win32: "file:///",
      } as Record<string, string>
    )[process.platform] || "file://";

  let builtString = "";
  strings.forEach((string, i) => {
    builtString += string + (values[i] || "");
  });
  const filePath = builtString.replace(/[\\\/]+/g, "/");
  return `${filePrefix}${filePath}`;
}
