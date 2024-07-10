import { Request, Response, NextFunction } from "express";
import catchAsync from "../utils/catch-async";
import { IssueService } from "../service/issue-service";

/**
 * Controller function to handle requests for getting data based on JQL.
 * The function is wrapped with catchAsync to handle any asynchronous errors.
 *
 * @param req The Express request object.
 * @param res The Express response object.
 * @param next The Express next middleware function.
 */
export const getData = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { jql } = req.query as { jql: string };

  if (!jql || !jql.length) throw new Error("JQL can not be empty");

  // Log the received JQL query for debugging
  console.log("\n[+] JQL:", jql);

  // Initialize the IssueService to handle JQL query execution
  const issueService = new IssueService();
  // Execute the JQL query and retrieve the results
  const data = await issueService.findIssuesByJql(jql);

  // Send the results as a JSON response
  res.status(200).json({ status: "success", results: data.length, data });
});
