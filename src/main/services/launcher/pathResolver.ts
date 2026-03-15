import { dirname, resolve } from "node:path";

const envPattern = /%([^%]+)%/g;

export const resolveWindowsPathTokens = (value: string): string =>
  value.replace(envPattern, (_, key: string) => process.env[key] ?? `%${key}%`);

export const resolveWorkingDirectory = (executablePath: string, declaredWorkingDirectory?: string): string => {
  if (declaredWorkingDirectory && declaredWorkingDirectory.trim().length > 0) {
    return resolveWindowsPathTokens(declaredWorkingDirectory);
  }

  return dirname(executablePath);
};

export const toAbsolutePath = (value: string): string => {
  const expanded = resolveWindowsPathTokens(value);
  return resolve(expanded);
};
