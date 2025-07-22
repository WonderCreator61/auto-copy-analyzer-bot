import express from "express";
import cors from "cors";
import { PORT, STORE } from "./utils/constants";
import { runQueryAndGetResult } from "./controllers/dune";
import { readFile } from "./utils/file";
import router from "./routes/targetRoutes";
import { simulateTargetWallets } from "./controllers/gmgn/gmgn";
import { addNewCopyHandler, startTelegramClient } from "./controllers/bloom";

const app = express();

// Enable CORS for all routes
app.use(cors());
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded


app.get("/", (req, res) => {
    res.send("Hello World");
});

app.get("/targets", async (req, res) => {
    try {
        const targets = await readFile("targets");
        res.json({ data: targets });
    } catch (err) {
        console.error("Error getting targets:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});

app.get("/queryRunning", async (req, res) => {
    res.json({ data: STORE.QUERY_RUNNING });
});

app.get("/simulationRunning", async (req, res) => {
    res.json({ data: STORE.SIMULATING });
});

app.get("/simulationResult", async (req, res) => {
    res.json({ data: STORE.GOOD_TARGETS });
});

app.post("/runQuery", async (req, res) => {
    try {
        runQueryAndGetResult();
        res.json({ message: "Query run successfully" });
    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
});

app.post("/simulate", async (req, res) => {
    try {
        simulateTargetWallets();
        res.json({ message: "Simulation triggered successfully" });
    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
});

app.post("/simulateFromImport", async (req, res) => {
    try {
        simulateTargetWallets(req.body.walletAddresses);
        res.json({ message: "Simulation triggered successfully" });
    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
});

app.post("/addConfig", addNewCopyHandler);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

const main = async () => {
    startTelegramClient();
    STORE.GOOD_TARGETS = await readFile("good_targets");
    // await initDB();
    // await runQueryAndGetResult();
};

main();