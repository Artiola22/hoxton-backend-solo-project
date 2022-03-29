import { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient({ log: ["error", "info", "query", "warn"] });

const messages: Prisma.MessageCreateInput[] = [
  {
    content: "Hello Arita",
    user: { connect: { id: 1 } },
    
    Conversation: { connect: { id: 2 } },
  },
  {
    content: "Hi hi!!",
    user: { connect: { id: 1 } },
    
    Conversation: { connect: { id: 3 } },
  },
  {
    content: "Where are you?",
    user: { connect: { id: 2 } },
    
    Conversation: { connect: { id: 3 } },
  },
  {
    content: "Click here",
    user: { connect: { id: 3 } },
   
    Conversation: { connect: { id: 4 } },
  },
];
const users: Prisma.UserCreateInput[] = [
  {
    fullName: "Artiola Caka",
    email: "artiola@gmail.com",
    password: bcrypt.hashSync("artiola"),
    phoneNumber: "+355696867666",
    profilePhoto: "https://avatars.dicebear.com/api/avataaars/OlaDomi.svg",
    userStatus: "Can't talk, message only 😶",
  },
  {
    fullName: "Arita Osmani",
    email: "arita@gmail.com",
    password: bcrypt.hashSync("arita"),
    phoneNumber: "+388695867766",
    profilePhoto: "https://avatars.dicebear.com/api/avataaars/aritaosmani.svg",
    userStatus: "Available 😁",
  },
  {
    fullName: "Desintila Luzi",
    email: "desintila@gmail.com",
    password: bcrypt.hashSync("desintila"),
    phoneNumber: "+355688867766",
    profilePhoto:
      "https://avatars.dicebear.com/api/avataaars/desintilaluzi.svg",
    userStatus: "Busy 😐",
  },
  {
    fullName: "Nicolas Marcora",
    email: "nicolas@gmail.com",
    password: bcrypt.hashSync("nicolas"),
    phoneNumber: "+499676888677",
    profilePhoto:
      "https://avatars.dicebear.com/api/avataaars/nicolasmarcora.svg",
    userStatus: "Back Back Back 🙃",
  },
];

const conversations: Prisma.ConversationCreateInput[] = [
  {
    user: { connect: { id: 1 } },
    participant: { connect: { id: 2 } },
    User: { connect: { phoneNumber: "+355696867666" } },
  },
  {
    user: { connect: { id: 2 } },
    participant: { connect: { id: 3 } },
    User: { connect: { phoneNumber: "+388695867766" } },
  },
  {
    user: { connect: { id: 4 } },
    participant: { connect: { id: 3 } },
    User: { connect: { phoneNumber: "+499676888677" } },
  },
  {
    user: { connect: { id: 3 } },
    participant: { connect: { id: 4 } },
    User: { connect: { phoneNumber: "+355688867766" } },
  },
];

async function createStuff() {
  for (const user of users) {
    await prisma.user.create({ data: user });
  }
  for (const conversation of conversations) {
    await prisma.conversation.create({ data: conversation });
  }
  for (const message of messages) {
    await prisma.message.create({ data: message });
  }
}
createStuff();
