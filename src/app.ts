import express from "express";
import helmet from "helmet";
import cors from "cors";
// import rateLimit from "express-rate-limit";
import routes from "./routes/v1/index.ts";
import { handleNotFound, successHandler } from "./utils/api.ts";

const app = express();

// set security HTTP headers
app.use(helmet());

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// Restrict all routes to only 100 requests per IP address every 1o minutes
// const limiter = rateLimit({
//     windowMs: 10 * 60 * 1000, // 10 minutes
//     max: 100, // 100 requests per IP
//     handler: (req, res) => {
//         res.status(429).json(
//             errorHandler(new Error("Rate limit reached! Too many requests."))
//         );
//     },
// });

// app.use(limiter);

// enable cors
app.use(cors());
app.options("*", cors());

// v1 api routes
app.use("/v1", routes);

// send back a 404 error for any unknown api request
app.use("/", (req, res, next) => {
    return res
        .status(200)
        .json(
            successHandler(
                null,
                "Business visa API server running successfully!"
            )
        );
});

app.use((req, res, next) => {
    return handleNotFound(res);
});

export default app;
