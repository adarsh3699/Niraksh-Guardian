import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const doctors = [
	{
		name: "Dr. Ayesha Khan",
		specialization: "Cardiologist",
		experienceYears: 12,
		consultationFee: 1500,
		location: "Mumbai, India",
		bio: "Expert in interventional cardiology with over a decade of experience in treating complex heart conditions.",
		contactInfo: "ayesha.khan@example.com",
		isAvailable: true,
		imageUrl: "https://example.com/dr-ayesha.jpg",
	},
	{
		name: "Dr. Rajesh Sharma",
		specialization: "Dermatologist",
		experienceYears: 8,
		consultationFee: 800,
		location: "Delhi, India",
		bio: "Specialist in clinical and cosmetic dermatology, helping patients achieve healthy and glowing skin.",
		contactInfo: "rajesh.sharma@example.com",
		isAvailable: true,
		imageUrl: "https://example.com/dr-rajesh.jpg",
	},
	{
		name: "Dr. Emily Chen",
		specialization: "General Physician",
		experienceYears: 15,
		consultationFee: 500,
		location: "Bangalore, India",
		bio: "Compassionate family physician dedicated to comprehensive primary care for patients of all ages.",
		contactInfo: "emily.chen@example.com",
		isAvailable: true,
		imageUrl: "https://example.com/dr-emily.jpg",
	},
	{
		name: "Dr. Michael Ross",
		specialization: "Neurologist",
		experienceYears: 20,
		consultationFee: 2500,
		location: "Chennai, India",
		bio: "Renowned neurologist specializing in stroke rehabilitation and neurodegenerative disorders.",
		contactInfo: "michael.ross@example.com",
		isAvailable: false,
		imageUrl: "https://example.com/dr-michael.jpg",
	},
	{
		name: "Dr. Sarah Gupta",
		specialization: "Pediatrician",
		experienceYears: 10,
		consultationFee: 700,
		location: "Hyderabad, India",
		bio: "Friendly pediatrician focused on child development, vaccinations, and common childhood illnesses.",
		contactInfo: "sarah.gupta@example.com",
		isAvailable: true,
		imageUrl: "https://example.com/dr-sarah.jpg",
	},
];

async function main() {
	console.log("Start seeding ...");
	for (const doctor of doctors) {
		const createdDoctor = await prisma.doctor.create({
			data: doctor,
		});
		console.log(`Created doctor with id: ${createdDoctor.id}`);
	}
	console.log("Seeding finished.");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
