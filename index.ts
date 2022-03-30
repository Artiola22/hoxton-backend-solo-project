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

function createToken(id: number) {
  //@ts-ignore
  const token = jwt.sign({ id: id }, process.env.SECRET_KEY, {
    expiresIn: "3days",
  });
  return token;
}

async function getUserFromToken(token: string) {
  //@ts-ignore
  const data = jwt.verify(token, process.env.SECRET_KEY);
  const user = await prisma.user.findUnique({
    where: { id: data.id },
    include: {
      Conversation: { include: { messages: true } },
      participants: { include: { participant: true } },
      users: { include: { User: true } },
    },
  });
  return user;
}
app.post("/register", async (req, res) => {
  const { fullName, email, phoneNumber, password } = req.body;
  const hash = bcrypt.hashSync(password);
  try {
    const user = await prisma.user.create({
      //@ts-ignore
      data: { fullName, email, phoneNumber, password: hash },
    });
    res.send({ user, token: createToken(user.id) });
  } catch (err) {
    //@ts-ignore
    res.status(400).send({ error: err.message });
  }
});

app.post("/sign-in", async (req, res) => {
  const { phoneNumber, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { phoneNumber: phoneNumber },
      include: { messages: true },
    });
    //@ts-ignore
    const passwordMatches = bcrypt.compareSync(password, user.password);
    if (user && passwordMatches) {
      res.send({ user, token: createToken(user.id) });
    } else {
      throw Error("Boom!");
    }
  } catch (err) {
    //@ts-ignore
    res.status(400).send({ error: "Email/Password invalid!" });
  }
});

app.get("/validate", async (req, res) => {
  const token = req.headers.authorization;

  try {
    //@ts-ignore
    const user = await getUserFromToken(token);
    res.send(user);
  } catch (err) {
    //@ts-ignore
    res.status(400).send({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server up : http://localhost:${PORT}`);
});
