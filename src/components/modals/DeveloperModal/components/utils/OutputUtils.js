export const OutputUtils = {
  formatError(action, error) {
    const message = error?.message || String(error || 'Error desconocido');
    return `Error al ${action}: ${message}`;
  },

  formatSuccess(message) {
    return message;
  },

  formatList(title, items, footer = '') {
    const body = Array.isArray(items) ? items.join('\n') : String(items ?? '');
    const footerText = footer ? `\n${footer}` : '';
    return `${title}\n${body}${footerText}`;
  },

  formatHelp(commandName, commands, examples = []) {
    const commandLines = Object.entries(commands || {})
      .map(([key, description]) => ` - ${key}: ${description}`);
    const exampleLines = (examples || []).map((example) => `   ${example}`);
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
