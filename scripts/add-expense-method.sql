-- ხარჯების ცხრილში გადახდის მეთოდის დამატება
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank'));

-- არსებული ჩანაწერების განახლება (ჩავთვალოთ რომ ყველა ნაღდი ფულით იყო)
UPDATE expenses SET payment_method = 'cash' WHERE payment_method IS NULL;
