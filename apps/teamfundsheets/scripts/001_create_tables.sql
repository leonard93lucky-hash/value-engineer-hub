-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month TEXT NOT NULL,
  name TEXT NOT NULL,
  transfer_date TEXT NOT NULL,
  amount BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  date TEXT NOT NULL,
  amount BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create policies for payments (public access for now - everyone can read and write)
CREATE POLICY "Allow public read on payments" ON public.payments
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on payments" ON public.payments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public delete on payments" ON public.payments
  FOR DELETE USING (true);

-- Create policies for expenses (public access for now - everyone can read and write)
CREATE POLICY "Allow public read on expenses" ON public.expenses
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on expenses" ON public.expenses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public delete on expenses" ON public.expenses
  FOR DELETE USING (true);
