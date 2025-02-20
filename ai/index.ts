import { MerkleClient, MerkleClientConfig } from "@merkletrade/ts-sdk";
import { Aptos } from "@aptos-labs/ts-sdk";
import dotenv from "dotenv";
dotenv.config();
import { Ed25519PrivateKey } from "@aptos-labs/ts-sdk";
import express from "express";
import MerkleOrderManager from "./merkleClient.ts";
import { propose } from "./propose.ts";

const app = express();
app.use(express.json());
const port = process.env.PORT || 4000;

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.get("/proposal", async (req, res) => {
  try {
    const proposal = await propose();
    res.send(proposal);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching proposal");
  }
});

app.post("/open-order", (req, res) => {
  const longSymbol = req.body.long;
  const shortSymbol = req.body.short;
  const merkleOrderManager = new MerkleOrderManager();
  merkleOrderManager
    .openOrder(longSymbol, shortSymbol)
    .then(() => {
      res.status(200).send(`Successfully opened order!`);
    })
    .catch((error) => {
      res.status(500).send(`Error opening order: ${error.message}`);
    });
});

app.post("/close-order", (req, res) => {
  const longSymbol = req.body.long;
  const shortSymbol = req.body.short;
  const merkleOrderManager = new MerkleOrderManager();
  merkleOrderManager
    .closeOrder(longSymbol, shortSymbol)
    .then(() => {
      res.status(200).send(`Successfully closed orders!`);
    })
    .catch((error) => {
      res.status(500).send(`Error closing order: ${error.message}`);
    });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
