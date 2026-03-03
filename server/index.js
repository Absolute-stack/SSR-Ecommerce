import "dotenv/config";
import cors from "cors";
import express from "express";
import compression from "compression";
import cookieParser from "cookie-parser";

const PORT = process.env.PORT;
const app = express();

app.use(compression());
app.use(cors());
app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send(`<h1>API is running</h1>`);
});

app.listen(PORT, () => console.log(`API is running on ${PORT}`));
