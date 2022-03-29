import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ log: ["error", "info", "query", "warn"] });
const app = express();
const PORT = 8000;

app.use(express.json());
app.use(cors());

app.get("/users", async (req, res) => {
  const user = await prisma.user.findMany({ include: { messages: true } });
  res.send(user);
});

app.get("/conversations", async (req, res) => {
  const conversation = await prisma.conversation.findMany({
    include: { user: true },
  });
  res.send(conversation);
});

app.get("users/:email", async (req, res) => {
  const email = req.params.email;

  try {
    const user = await prisma.user.findUnique({
      where: { email: email },
      include: {
        messages: { select: { Conversation: { include: { messages: true } } } },
      },
    });
    if (user) {
      res.send(user);
    } else {
      res.status(404).send({ error: "User not found!" });
    }
  } catch (err) {
    //@ts-ignore
    res.send(400).send(`<pre>${err.message}</pre>`);
  }
});

app.listen(PORT, () => {
  console.log(`Server up : http://localhost:${PORT}`);
});
