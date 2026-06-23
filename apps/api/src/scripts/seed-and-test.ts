import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";
import { WalletService } from "../modules/wallet/wallet.service";
import { ConsultationsService } from "../modules/consultations/consultations.service";
import { PrismaService } from "../database/prisma.service";
import { PasswordHelper } from "../common/utils/password.helper";
import { AstrologersService } from "../modules/astrologers/astrologers.service";
import { OnboardAstrologerDto } from "../modules/astrologers/dto/astrologer.dto";

async function run() {
  console.log("Starting DB seed & consultation simulation...");
  
  // 1. Boot NestJS standalone context
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const prisma = app.get(PrismaService);
  const walletService = app.get(WalletService);
  const consultationsService = app.get(ConsultationsService);
  const astrologersService = app.get(AstrologersService);

  try {
    // 2. Create customer if not exists
    const customerEmail = "customer@test.com";
    const customerPassword = "password123";
    const customerHash = await PasswordHelper.hash(customerPassword);
    
    let customer = await prisma.user.findUnique({ where: { email: customerEmail } });
    if (!customer) {
      customer = await prisma.user.create({
        data: {
          email: customerEmail,
          passwordHash: customerHash,
          name: "Test Customer",
          role: "USER",
          authProvider: "EMAIL",
          wallet: {
            create: { balance: 0.0 }
          }
        }
      });
      console.log(`Created test customer: ${customerEmail}`);
    } else {
      console.log(`Test customer already exists: ${customerEmail}`);
    }

    // Initialize or reset wallet balance for testing
    const wallet = await prisma.wallet.findUnique({ where: { userId: customer.id } });
    if (wallet) {
      await prisma.wallet.update({
        where: { userId: customer.id },
        data: { balance: 0.0 }
      });
      // Clear ledger and transaction entries for customer to start clean
      await prisma.walletLedgerEntry.deleteMany({ where: { walletId: wallet.id } });
      await prisma.walletTransaction.deleteMany({ where: { userId: customer.id } });
    }

    // 3. Create 5 approved and available astrologers
    const astrologerData = [
      { name: "Astro Kumar", email: "kumar@astro.com", bio: "Expert Vedic astrologer with 10+ years of experience.", price: 10, skills: ["Vedic", "Palmistry"], languages: ["HI", "EN"] },
      { name: "Astro Sharma", email: "sharma@astro.com", bio: "Tarot card reader and Kundli matchmaker.", price: 20, skills: ["Tarot", "Kundli"], languages: ["HI"] },
      { name: "Astro Priya", email: "priya@astro.com", bio: "Numerology practitioner and Vastu shastra consultant.", price: 15, skills: ["Numerology", "Vastu"], languages: ["EN"] },
      { name: "Astro Ananya", email: "ananya@astro.com", bio: "Lagna and Nakshatra readings for career & marriage.", price: 25, skills: ["Lagna", "Nakshatra"], languages: ["HI", "EN"] },
      { name: "Astro Guru", email: "guru@astro.com", bio: "Spiritual guide, Vedic and Nadi astrologer.", price: 50, skills: ["Vedic", "Nadi"], languages: ["HI", "EN"] }
    ];

    const approvedAstrologers = [];

    for (const data of astrologerData) {
      let user = await prisma.user.findUnique({ where: { email: data.email } });
      if (!user) {
        const hash = await PasswordHelper.hash("password123");
        user = await prisma.user.create({
          data: {
            email: data.email,
            passwordHash: hash,
            name: data.name,
            role: "ASTROLOGER",
            authProvider: "EMAIL",
            wallet: {
              create: { balance: 0.0 }
            }
          }
        });
      }

      let astrologer = await prisma.astrologer.findUnique({ where: { userId: user.id } });
      if (astrologer) {
        // Clear previous consultations and exceptions to start clean
        await prisma.consultation.deleteMany({ where: { astrologerId: astrologer.id } });
        await prisma.astrologer.delete({ where: { id: astrologer.id } });
      }

      // Onboard astrologer
      const onboardDto: OnboardAstrologerDto = {
        bio: data.bio,
        pricingPerMin: data.price,
        skills: data.skills,
        languages: data.languages
      };
      
      const onboarded = await astrologersService.onboard(user.id, onboardDto);

      // Submit KYC verification record so reviewKyc can find it
      await astrologersService.submitKyc(user.id, {
        idType: "PAN",
        idNumber: "ABCDE1234F",
        idDocUrl: "https://example.com/doc.jpg",
      });
      
      // Auto approve
      await astrologersService.reviewKyc(onboarded!.id, customer.id, {
        status: "APPROVED",
        rejectionReason: undefined
      });

      // Force availability
      const updated = await prisma.astrologer.update({
        where: { id: onboarded!.id },
        data: { isAvailable: true }
      });

      approvedAstrologers.push(updated);
      console.log(`Created & approved astrologer: ${data.name} (₹${data.price}/min)`);
    }

    // 4. Add Wallet Amount (₹1000)
    console.log(`Crediting ₹1000 test funds to customer's wallet...`);
    await walletService.addFunds(customer.id, 1000);

    // 5. Book a Consultation (with Astro Kumar, the first one)
    const targetAstro = approvedAstrologers[0];
    const scheduledAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins in future

    console.log(`Booking consultation with ${astrologerData[0].name} (₹10/min)...`);
    const consultation = await consultationsService.create(customer.id, {
      astrologerId: targetAstro.id,
      scheduledAt: scheduledAt.toISOString()
    });
    console.log(`Consultation booked successfully: ID = ${consultation.id}`);

    // 6. Start the consultation (ACTIVE)
    console.log("Starting consultation session...");
    await consultationsService.start(customer.id, consultation.id);

    // 7. Complete the consultation (duration 30 mins -> ₹300)
    console.log("Completing consultation session (Duration: 30 minutes)...");
    const completed = await consultationsService.complete(customer.id, consultation.id, {
      durationMin: 30
    });
    console.log(`Consultation completed! Total Cost: ₹${completed.cost}`);

    // 8. Verify final states
    const finalCustomerWallet = await prisma.wallet.findUnique({ where: { userId: customer.id } });
    const finalAstroWallet = await prisma.wallet.findUnique({ where: { userId: targetAstro.userId } });

    console.log("----------------------------------------");
    console.log("SIMULATION SUCCESSFUL");
    console.log(`Customer final wallet balance: ₹${finalCustomerWallet?.balance}`);
    console.log(`Astrologer final wallet balance: ₹${finalAstroWallet?.balance}`);
    console.log("----------------------------------------");

  } catch (error) {
    console.error("Simulation failed:", error);
  } finally {
    await prisma.$disconnect();
    await app.close();
  }
}

void run();
