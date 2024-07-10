import { join } from "path";
import express, { Request, Response, NextFunction } from "express";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import xssClean from "xss-clean";
import hpp from "hpp";
import cors from "cors";
import csurf from "csurf";
import cookieParser from "cookie-parser";
import compression from "compression";

import AppError from "./src/utils/app-error";
import globalErrorHandler from "./src/controllers/error-controller";

import jqlRouter from "./src/routes/jql-router";

const app = express();

app.set("view engine", "pug");
app.set("views", join(__dirname, "views")); // For templates or Server Side Rendering
app.use(express.static(join(__dirname, "public")));

app.disable("x-powered-by"); // provide an extra layer of obsecurity to reduce server fingerprinting.

if (process.env.NODE_ENV === "DEV") app.use(morgan("dev"));

app.use(
  helmet({
    hsts: {
      includeSubDomains: true,
      preload: true,
      maxAge: 63072000,
    },
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'", "https://*.cloudflare.com", "http://localhost:8000/"],
        baseUri: ["'self'"],
        scriptSrc: [
          "self",
          "http://localhost:8000/",
          "http://127.0.0.1:8000/",
          "https://*.cloudflare.com",
          "https://polyfill.io",
        ],
        styleSrc: ["self", "https:", "http:", "unsafe-inline"],
        imgSrc: ["'self'", "data:", "blob:"],
        fontSrc: ["'self'", "https:", "data:"],
        childSrc: ["'self'", "blob:"],
        styleSrcAttr: ["'self'", "unsafe-inline", "http:"],
        frameSrc: ["'self'"],
      },
    },
  })
);

app.use(
  cors({
    origin: "http://localhost:8000",
    credentials: true,
  })
);

const limiter = rateLimit({
  max: 10,
  windowMs: 60 * 1000,
  headers: true,
});
app.use("/api", limiter);

app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use(compression());
app.use(
  csurf({
    cookie: { httpOnly: true, secure: true },
    ignoreMethods: ["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE", "PATCH"],
  })
);
app.set("trust proxy", 1); // trust first proxy
app.use(xssClean());
app.use(hpp());

app.use((req: Request | any, res: Response, next: NextFunction) => {
  req.requestTime = new Date().toISOString();
  next();
});

/* 
NOTE:
  #################################
  #### Initialize Routers HERE ####
  #################################
*/
app.use("/api/v1", jqlRouter);

app.all("*", (req: Request, res: Response, next: NextFunction) => {
  const err = new AppError(`Can't find ${req.originalUrl} on this server!`, 404);
  next(err);
});

app.use(globalErrorHandler);

export default app;
