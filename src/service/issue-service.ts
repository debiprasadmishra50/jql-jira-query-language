import { Brackets, Repository } from "typeorm";
import { Issue } from "../models/issue.entity";
import { getRepository } from "../utils/get-data-source";
import { JqlService } from "./jql-service";

/**
 * Service class to handle operations related to Issues.
 */
let globalIndex = 0
export class IssueService {
  private _jqlService: JqlService;
  private _issueRepository: Repository<Issue>;

  // Getter for issueRepository
  private get issueRepository(): Repository<Issue> {
    return this._issueRepository;
  }

  // Setter for issueRepository
  private set issueRepository(value: any) {
    this._issueRepository = value;
  }

  // Getter for jqlService
  private get jqlService(): JqlService {
    return this._jqlService;
  }

  // Setter for jqlService
  private set jqlService(value: any) {
    this._jqlService = value;
  }

  /**
   * Constructor to initialize JqlService and IssueRepository.
   */
  constructor() {
    this._jqlService = new JqlService();
    this._issueRepository = getRepository(Issue);
  }

  /**
   * Finds issues based on a JQL (Jira Query Language) query.
   * @param query The JQL query string.
   * @returns A promise that resolves to an array of Issue entities.
   */
  async findIssuesByJql(query: string): Promise<Issue[]> {
    // Parse the JQL query into an AST (Abstract Syntax Tree)
    const ast = this.jqlService.parse(query);

    // Validate the parsed AST
    this.jqlService.validate(ast);

    // Create a query builder for the Issue entity
    const qb = this.issueRepository.createQueryBuilder("issue");

    // Build the query using the conditions from the AST
    this.buildQuery(qb, ast.conditions);

    // Apply ordering to the query based on the AST
    this.applyOrderBy(qb, ast.orderBy);

    // Log the final query for debugging
    console.log("\n[+] QUERY:\n", qb.getQueryAndParameters(), "\n");

    // Execute the query and return the results
    let results: Issue[];

    try {
      results = await qb.getMany();
      console.log("\n[+] Results", results, "\n");
    } catch (err) {
      console.error(err);
    }

    return results;
  }

  /**
   * Builds a SQL query from an array of conditions and adds it to the query builder.
   * @param qb The query builder instance.
   * @param conditions An array of conditions representing the parsed JQL query.
   * @param parentOperator The parent logical operator (AND, OR, NOT) to apply to the conditions.
   */
  private buildQuery(qb: any, conditions: any[], parentOperator: string = "AND") {
    // Iterate over each condition in the conditions array
    conditions.forEach((condition) => {
      // If the condition is a logical operator, update the parentOperator
      if (condition.operator === "AND" || condition.operator === "OR" || condition.operator === "NOT") {
        parentOperator = condition.operator;
      }
      // If the condition is a group of conditions, recursively build the query for the group
      else if (Array.isArray(condition.group)) {
        qb[parentOperator === "AND" ? "andWhere" : "orWhere"](
          new Brackets((qb2) => {
            this.buildQuery(qb2, condition.group);
          })
        );
      }
      // If the condition is a field operation, build the SQL condition
      else {
        const { field, operator, values } = condition;
        if (operator === "UNKNOWN_OPERATOR") {
          throw new Error(`Unknown operator for field: ${field}`);
        }
        // Get the SQL condition string based on the field, operator, and values
        const sqlCondition = this.getSqlCondition(field, operator, values, globalIndex);
        // Add the SQL condition to the query builder with the appropriate operator
        if (operator === "IN") {
          qb[parentOperator === "AND" ? "andWhere" : "orWhere"](sqlCondition, {
            [`values${globalIndex}`]: values,
          });
        } else {
          qb[parentOperator === "AND" ? "andWhere" : "orWhere"](sqlCondition, {
            [`value${globalIndex}`]: values[0],
          });
        }
        globalIndex++
      }
    });
  }

  /**
   * Applies ordering to the query based on the orderBy conditions.
   * @param qb The query builder.
   * @param orderBy The orderBy conditions from the AST.
   */
  private applyOrderBy(qb: any, orderBy: any[]) {
    orderBy.forEach((order) => {
      qb.addOrderBy(`issue.${order.field}`, order.direction as "ASC" | "DESC");
    });
  }

  /**
   * Converts a condition into an SQL-compatible condition string.
   * @param field The field to apply the condition on.
   * @param operator The operator to use in the condition.
   * @param values The values to compare the field against.
   * @param index The index of the condition in the array.
   * @returns The SQL condition string.
   */
  private getSqlCondition(field: string, operator: string, values: any[], index: number): string {
    switch (operator) {
      case "=":
        return `issue.${field} = :value${index}`;
      case "!=":
        return `issue.${field} <> :value${index}`;
      case ">":
        return `issue.${field} > :value${index}`;
      case "<":
        return `issue.${field} < :value${index}`;
      case ">=":
        return `issue.${field} >= :value${index}`;
      case "<=":
        return `issue.${field} <= :value${index}`;
      case "IN":
        return `issue.${field} IN (:...values${index})`;
      case "IS":
        return `issue.${field} IS ${values[0]}`;
      case "IS NOT":
        return `issue.${field} IS NOT ${values[0]}`;
      case "CONTAINS":
        return `issue.${field} LIKE :value${index}`;
      default:
        throw new Error(`Unknown operator: ${operator}`);
    }
  }
}
