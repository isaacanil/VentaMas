export const generateResponse = (input) => {
    input = input.toLowerCase().trim();
  
    const greetings = ["hola", "hola!", "hola.", "¡hola!", "¡hola"];
    const farewells = ["adios", "adiós", "adios!", "adiós!", "¡adios!", "¡adiós!"];
    const help = ["ayuda", "help", "ayuda!", "help!"];

    const configPath = ["configuracion", "configuración"];
    const inventory = ["inventario", "inventario!"];
    const sales = ["ventas", "ventas!"];
    const purchases = ["compras", "compras!"];
    const clients = ["clientes", "clientes!"];
    const providers = ["proveedores", "proveedores!"];
    const categories = ["categorias", "categorias!"];
    const users = ["usuarios", "usuarios!"];
    const reports = ["reportes", "reportes!"];
    const orders = ["pedidos", "pedidos!"];
    const products = ["productos", "productos!"];

    const defaultMessage = "Lo siento, no entiendo tu pregunta.";
  
    if (greetings.includes(input)) {
      return "¡Hola! ¿Cómo puedo ayudarte?";
    }
  
    if (farewells.includes(input)) {
      return "¡Adiós! Que tengas un buen día.";
    }
    // if (configPath.includes(input) ) {
    //   return { text: "De acuerdo, te llevaré a la página de configuración.", route: "/app/settings" };
    // }
    switch (true) {
      case configPath.includes(input):
        return { text: "De acuerdo, te llevaré a la página de configuración.", route: "/app/settings" };
      case inventory.includes(input):
        return { text: "De acuerdo, te llevaré a la página de inventario.", route: "/app/inventario/items" };
      case sales.includes(input):
        return { text: "De acuerdo, te llevaré a la página de ventas.", route: "/app/sales" };
      case purchases.includes(input):
        return { text: "De acuerdo, te llevaré a la página de compras.", route: "/app/purchases" };
      case clients.includes(input):

      default:
        break;
    }
  
    // Añade más reglas aquí para hacer que el chatbot sea más natural.
  
    return defaultMessage;
  };