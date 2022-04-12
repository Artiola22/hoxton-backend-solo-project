import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import { PrismaClient, Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import "dotenv/config";

const prisma = new PrismaClient({ log: ["error", "warn"] });
const app = express();
const PORT = 8000;

app.use(express.json());
app.use(cors());

app.get("/users", async (req, res) => {
  const user = await prisma.user.findMany({
    include: { messages: true, users: true },
  });
  res.send(user);
});

app.get("/conversations", async (req, res) => {
  const conversation = await prisma.conversation.findMany({
    include: { user: true, participant: true, messages: true },
  });
  res.send(conversation);
});

app.post("/conversations", async (req, res) => {
  const token = req.headers.authorization || "";
  const { participantId } = req.body;
  try {
    const user = await getUserFromToken(token);

    const conversation = await prisma.conversation.create({
      //@ts-ignore
      data: { participantId: participantId, userId: user.id },
      include: { messages: true, participant: true, user: true },
    });
    //@ts-ignore
    user.conversations.push(conversation);
    res.send(user);
  } catch (err) {
    //@ts-ignore
    res.status(400).send({ error: err.message });
  }
});
app.get("/messages", async (req, res) => {
  const message = await prisma.user.findMany({
    include: { messages: true, participants: true, users: true },
  });
  res.send(message);
});

app.get("/messages/:conversationId", async (req, res) => {
  const conversationId = Number(req.params.conversationId);

  try {
    const messages = await prisma.message.findMany({
      where: { conversationId: conversationId },
      include: { user: true },
    });
    res.send(messages);
  } catch (err) {
    //@ts-ignore
    res.send(400).send(`<pre>${err.message}</pre>`);
  }
});

// app.get('/conversations/:conversationId', async(req, res)=>{
//   const conversationId = Number(req.params.conversationId)

//   try{
//  const conversations = await prisma.conversation.findMany({
//    where: {id: conversationId }, include: {messages :{include: {user: true}}, user:true }
//  })
//  res.send(conversations)
//   }catch(err){
// //@ts-ignore
// res.send(400).send(`<pre>${err.message}</pre>`);
//   }
// })

app.get("/conversations/:conversationId", async (req, res) => {
  const conversationId = Number(req.params.conversationId);

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: { include: { user: true } },
        participant: true,
        user: true,
      },
    });
    res.send(conversation);
  } catch (err) {
    //@ts-ignore
    res.send(400).send(`<pre>${err.message}</pre>`);
  }
});

app.get("/my-conversations", async (req, res) => {
  const token = req.headers.authorization || "";
  try {
    const user = await getUserFromToken(token);
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          //@ts-ignore
          { userId: user.id },

          //@ts-ignore
          { participantId: user.id },
        ],
      },
      include: { messages: true, user: true, participant: true },
    });
    res.send(conversations);
  } catch (err) {
    //@ts-ignore
    res.status(400).send(`<pre>${err.message}</pre>`);
  }
});

app.get("/conversation-with/:userId", async (req, res) => {
  const token = req.headers.authorization || "";
  const userId = Number(req.params.userId);
  try {
    const user = await getUserFromToken(token);
    // check if the conversation between this users exists

    const conversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          //@ts-ignore
          { userId: { in: [user.id, userId] } },

          //@ts-ignore
          { participantId: { in: [user.id, userId] } },
        ],
      },
      include: { messages: true, participant: true, user: true },
    });
    //if it exist we send it back
    if (conversation) {
      res.send(conversation);
    } else {
      //if it doesent exist we create it and send it
      const newConversation = await prisma.conversation.create({
        //@ts-ignore
        data: { participantId: userId, userId: user.id },
        include: { messages: true },
      });
      res.send(newConversation);
    }
  } catch (err) {
    //@ts-ignore
    res.status(400).send(`<pre>${err.message}</pre>`);
  }
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
    res.status(400).send(`<pre>${err.message}</pre>`);
  }
});

app.get("users/:email", async (req, res) => {
  const email = req.params.email;
  try {
    const user = await prisma.user.findFirst({
      where: { email: email },
      include: { messages: true, participants: true },
    });
    if (user) {
      res.send(user);
    } else {
      res.status(404).send({ error: "User Not Found!" });
    }
  } catch (err) {
    //@ts-ignore
    res.status(400).send({ err: err.message });
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
    //@ts-ignore
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
      data: { fullName, email, phoneNumber, password: hash },
    });
    res.send({ user, token: createToken(user.id) });
  } catch (err) {
    //@ts-ignore
    res.status(400).send({ error: err.message });
  }
});

app.post("/sign-in", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email: email },
      include: { messages: true },
    });
    console.log("user:", user);
    //@ts-ignore
    if (user) {
      const passwordMatches = bcrypt.compareSync(password, user.password);
      if (passwordMatches) {
        res.send({ user, token: createToken(user.id) });
      } else {
        // throw Error("Boom!");
        res.send("inside out");
      }
    } else {
      res.status(400).send("error");
    }
  } catch (err) {
    console.log(err);
    //@ts-ignore
    res.status(400).send({ error: "Email/Password invalid!" });
  }
});

app.post("/messages", async (req, res) => {
  const token = req.headers.authorization || "";
  const { content, conversationId } = req.body;
  try {
    const user = await getUserFromToken(token);
    if (user) {
      const newMessage = await prisma.message.create({
        data: {
          userId: user.id,
          content: content,
          conversationId: conversationId,
        },
      });
      res.send(newMessage);
    } else {
      res.send({ error: "User not found" });
    }
  } catch (err) {
    //@ts-ignore
    res.status(400).send({ error: err.message });
  }
});

app.delete("/conversation-with/:userId", async (req, res) => {
  const id = Number(req.params.userId);
  const token = req.headers.authorization || "";
  try {
    const user = await getUserFromToken(token);
    const conversationToDelete = await prisma.conversation.findUnique({
      where: { id },
    });

    if (user?.id === conversationToDelete?.userId) {
      const conversationDeleted = await prisma.conversation.delete({
        where: { id: id },
      });
      res.send(conversationDeleted);
    } else {
      res.status(404).send({ error: "Not authorized to delete" });
    }
  } catch (err) {
    // @ts-ignore
    res.status(400).send({ err: err.message });
  }
});

app.get("/validate", async (req, res) => {
  const token = req.headers.authorization || "";
  try {
    const user = await getUserFromToken(token);
    if (user) {
      res.status(200).send(user);
    } else {
      throw Error("Invalid token");
    }
  } catch (err) {
    //@ts-ignore
    res.status(400).send({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server up : http://localhost:${PORT}`);
});
