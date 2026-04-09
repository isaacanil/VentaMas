type HelpCommands = Record<string, string>;

type ListItems = string[] | string | number | null | undefined;

export const OutputUtils = {
  formatError(action: string, error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : String(error ?? 'Error desconocido');
    return `Error al ${action}: ${message}`;
  },

  formatSuccess(message: string) {
    return message;
  },

  formatList(title: string, items: ListItems, footer = '') {
    const body = Array.isArray(items) ? items.join('\n') : String(items ?? '');
    const footerText = footer ? `\n${footer}` : '';
    return `${title}\n${body}${footerText}`;
  },

  formatHelp(
    commandName: string,
    commands: HelpCommands = {},
    examples: string[] = [],
  ) {
    const commandLines = Object.entries(commands).map(
      ([key, description]) => ` - ${key}: ${description}`,
    );
    const exampleLines = examples.map((example) => `   ${example}`);
    const sections = [
      `Comandos disponibles para ${commandName}:`,
      ...commandLines,
    ];
    if (exampleLines.length) {
      sections.push('\nEjemplos:');
      sections.push(...exampleLines);
    }
    return sections.join('\n');
  },
};

export default OutputUtils;
