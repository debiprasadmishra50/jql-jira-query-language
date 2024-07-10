/**
 * Service for parsing and validating JQL (JSON Query Language) queries.
 */
export class JqlService {
  /**
   * Parses a JQL query string into an abstract syntax tree (AST).
   * @param query The JQL query string.
   * @returns An object containing the conditions AST and order by AST.
   */
  parse(query: string): any {
    const tokens = this.tokenize(query);
    const [conditionsTokens, orderByTokens] = this.splitOrderBy(tokens);

    const conditionsAst = this.buildAST(conditionsTokens);
    const orderByAst = this.buildOrderByAST(orderByTokens);

    return {
      conditions: conditionsAst,
      orderBy: orderByAst,
    };
  }

  /**
   * Validates the parsed AST.
   * @param ast The abstract syntax tree to validate.
   * @returns True if the AST is valid, otherwise throws an error.
   */
  validate(ast: any): boolean {
    if (!ast || !ast.conditions || !Array.isArray(ast.conditions)) {
      throw new Error("Invalid JQL syntax");
    }
    // Additional validation checks can be added here if needed
    return true;
  }

  /**
   * Tokenizes a JQL query string into individual tokens.
   * @param query The JQL query string.
   * @returns An array of tokens.
   */
  private tokenize(query: string): string[] {
    return query.match(
      /(\bORDER BY\b|\bIS NOT\b|\bIS\b|\bNOT\b|"[^"]+"|\w+|AND|OR|IN|CONTAINS|>=|<=|!=|>|<|=|\(|\)|,|ASC|DESC)/g
    );
  }

  /**
   * Splits the tokens into conditions and order by tokens.
   * @param tokens The array of tokens.
   * @returns A tuple containing the conditions tokens and order by tokens.
   */
  private splitOrderBy(tokens: string[]): [string[], string[]] {
    const orderByIndex = tokens.indexOf("ORDER BY");
    if (orderByIndex === -1) {
      return [tokens, []];
    } else {
      return [tokens.slice(0, orderByIndex), tokens.slice(orderByIndex + 1)]; // Skip "ORDER BY"
    }
  }

  /**
   * Builds an Abstract Syntax Tree (AST) from a list of tokens.
   * @param tokens An array of strings representing the tokens of the JQL query.
   * @returns An array representing the conditions of the query in AST format.
   */
  private buildAST(tokens: string[]): any[] {
    const conditions = []; // Initialize an empty array to hold the conditions
    let i = 0; // Initialize a counter for iterating through the tokens

    // Loop through the tokens
    while (i < tokens.length) {
      if (tokens[i] === "(") {
        // Check if the current token is an opening parenthesis
        const group = []; // Initialize a new group for nested conditions
        i++; // Move to the next token
        // Collect tokens until the closing parenthesis is encountered
        while (tokens[i] !== ")" && i < tokens.length) {
          group.push(tokens[i++]);
        }
        // Recursively build the AST for the group and add it to conditions
        conditions.push({ group: this.buildAST(group) });
        i++; // Move past the closing parenthesis
      } else if (tokens[i] === "AND" || tokens[i] === "OR" || tokens[i] === "NOT") {
        // Check if the token is a logical operator and add it to conditions
        conditions.push({ operator: tokens[i++] });
      } else if (tokens[i] === "ORDER BY") {
        break; // Stop processing conditions when ORDER BY is encountered
      } else {
        // Process field, operator, and values for the condition
        const field = tokens[i++]; // Get the field name
        const operator = this.getOperator(tokens, i); // Get the operator
        i += 1; // Advance by one since the regex tokenizes multi-word operators as single units
        const values = []; // Initialize an array to hold the values

        if (operator === "IN") {
          if (tokens[i] === "(") {
            // Check for the opening parenthesis after IN operator
            i++; // Move to the next token
            // Collect values until the closing parenthesis is encountered
            while (tokens[i] !== ")" && i < tokens.length) {
              if (tokens[i] !== ",") {
                values.push(tokens[i++].replace(/"/g, "")); // Add the value without quotes
              } else {
                i++; // Skip comma
              }
            }
            i++; // Move past the closing parenthesis
          } else {
            throw new Error("Invalid syntax: expected parentheses for IN operator");
          }
        } else {
          // Collect a single value for the operator
          if (tokens[i] && !["ORDER BY", "ASC", "DESC"].includes(tokens[i])) {
            values.push(tokens[i++].replace(/"/g, "")); // Add the value without quotes
          } else {
            throw new Error("Invalid syntax: expected value after operator " + tokens[i - 1]);
          }
        }

        // Add the condition with field, operator, and values to conditions
        conditions.push({ field, operator, values });
      }
    }

    return conditions; // Return the array of conditions
  }

  /**
   * Builds an Abstract Syntax Tree (AST) for the ORDER BY clause from a list of tokens.
   * @param tokens An array of strings representing the tokens of the ORDER BY clause.
   * @returns An array representing the ORDER BY conditions in AST format.
   */
  private buildOrderByAST(tokens: string[]): any[] {
    const orderBy = []; // Initialize an empty array to hold the ORDER BY conditions
    let i = 0; // Initialize a counter for iterating through the tokens

    // Loop through the tokens
    while (i < tokens.length) {
      const field = tokens[i++]; // Get the field name
      // Get the direction (ASC or DESC), default to ASC if not specified
      const direction = tokens[i] === "ASC" || tokens[i] === "DESC" ? tokens[i++] : "ASC";
      // Add the field and direction to the orderBy array
      orderBy.push({ field, direction });
      if (tokens[i] === ",") {
        i++; // Skip comma
      }
    }

    return orderBy; // Return the array of ORDER BY conditions
  }

  /**
   * Retrieves the operator from the tokens at the specified index.
   * @param tokens The array of tokens.
   * @param index The index to retrieve the operator from.
   * @returns The operator as a string.
   * @throws An error if the operator is unknown.
   */
  private getOperator(tokens: string[], index: number): string {
    const operators = ["!=", ">=", "<=", ">", "<", "=", "IN", "IS NOT", "IS", "CONTAINS", "NOT"];

    if (operators.includes(tokens[index])) return tokens[index];

    throw new Error("Unknown operator: " + tokens[index]);
  }
}
