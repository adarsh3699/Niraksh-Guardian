import { PrismaClient } from "../generated/prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import env from "../config/env";

const databaseUrl = env.DATABASE_URL.trim().replace(/^['"]|['"]$/g, "");

const prisma = new PrismaClient({
	accelerateUrl: databaseUrl,
}).$extends(withAccelerate());

export default prisma;
