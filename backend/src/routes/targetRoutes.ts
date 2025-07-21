import { Router } from "express";
import { readFile } from "../utils/file";

const router = Router();

router.get("/", async (req, res) => {
    try {
        const targets = await readFile("targets");
        res.json(targets);
    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;