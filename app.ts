import express from "express";
import { router as image} from "./api/image";
import { router as user} from "./api/user";
import { router as vote} from "./api/vote";
import bodyParser from "body-parser";
const cors = require('cors');

export const app = express();
app.use(cors());
app.use(bodyParser.text());
app.use(bodyParser.json());

app.use("/image", image);
app.use("/user", user);
app.use("/vote", vote);


