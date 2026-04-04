import { PrismaClient } from "../generated/prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import env from "../config/env";

const prisma = new PrismaClient({
	accelerateUrl: env.DATABASE_URL,
}).$extends(withAccelerate());

export default prisma;
