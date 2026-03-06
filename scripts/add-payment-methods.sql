-- Add payment fields to sales table
ALTER TABLE sales ADD COLUMN IF NOT EXISTS paid_in_cash NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS paid_in_card NUMERIC(12,2) NOT NULL DEFAULT 0;

-- Update existing sales to cover paid amount with cash as fallback setup
UPDATE sales SET paid_in_cash = COALESCE(paid_amount, total_amount) WHERE paid_in_cash = 0 AND paid_in_card = 0;

-- Add payment fields to purchase_history table
ALTER TABLE purchase_history ADD COLUMN IF NOT EXISTS paid_in_cash NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE purchase_history ADD COLUMN IF NOT EXISTS paid_in_card NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE purchase_history ADD COLUMN IF NOT EXISTS supplier TEXT;

-- Update existing purchase history assuming historical ones are fully paid in cash
UPDATE purchase_history SET paid_in_cash = (purchase_price * quantity) WHERE paid_in_cash = 0 AND paid_in_card = 0;
