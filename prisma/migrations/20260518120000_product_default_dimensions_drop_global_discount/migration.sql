-- Add optional default dimensions to Product so the quote form can autofill them.
ALTER TABLE "Product" ADD COLUMN "defaultWidthCm" DOUBLE PRECISION;
ALTER TABLE "Product" ADD COLUMN "defaultHeightCm" DOUBLE PRECISION;
ALTER TABLE "Product" ADD COLUMN "defaultLengthCm" DOUBLE PRECISION;

-- Drop the global quote discount. Only per-line discount remains.
ALTER TABLE "Quote" DROP COLUMN "globalDiscountPercentage";
