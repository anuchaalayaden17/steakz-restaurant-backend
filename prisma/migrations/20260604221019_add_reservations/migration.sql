-- CreateTable
CREATE TABLE "public"."Reservation" (
    "reservationId" SERIAL NOT NULL,
    "customerName" TEXT NOT NULL,
    "email" TEXT,
    "phoneNumber" TEXT,
    "reservationDate" TIMESTAMP(3) NOT NULL,
    "reservationTime" TEXT NOT NULL,
    "numberOfGuests" INTEGER NOT NULL,
    "reservationStatus" TEXT NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "branchId" INTEGER NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("reservationId")
);

-- AddForeignKey
ALTER TABLE "public"."Reservation" ADD CONSTRAINT "Reservation_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("branchId") ON DELETE RESTRICT ON UPDATE CASCADE;
