import express from "express";
import { getData } from "../controllers/user-controller";

const jqlRouter = express.Router();

jqlRouter.get("/jql", getData);

export default jqlRouter;
