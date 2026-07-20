import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$transaction(async (tx) => {
    const deletedQuestions = await tx.feedbackQuestion.deleteMany({
      where: {
        OR: [
          { question: { contains: "shdjh", mode: "insensitive" } },
          { question: { contains: "shgjh", mode: "insensitive" } },
        ],
      },
    });

    const deletedProjects = await tx.project.deleteMany({
      where: {
        OR: [
          { id: "cmrech3s00003l404pw6bssn5" },
          { nameZh: { equals: "yiliao", mode: "insensitive" } },
        ],
      },
    });

    return {
      deletedProjects: deletedProjects.count,
      deletedQuestions: deletedQuestions.count,
    };
  });

  console.log(JSON.stringify(result));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
