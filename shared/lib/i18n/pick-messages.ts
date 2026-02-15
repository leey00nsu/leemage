type IntlMessages = Record<string, unknown>;

export function pickMessages<T extends IntlMessages>(
  messages: T,
  namespaces: string[],
) {
  const picked: Partial<T> = {};

  for (const namespace of namespaces) {
    const topLevelKey = namespace.split(".")[0] as keyof T;
    if (topLevelKey in messages) {
      picked[topLevelKey] = messages[topLevelKey];
    }
  }

  return picked;
}
