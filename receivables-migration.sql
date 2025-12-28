-- Create receivables table
CREATE TABLE IF NOT EXISTS public.receivables (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    expected_date DATE NOT NULL,
    category TEXT NOT NULL,
    received BOOLEAN DEFAULT FALSE,
    received_date DATE,
    account_id TEXT REFERENCES public.accounts(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own receivables
CREATE POLICY "Users can manage their own receivables"
ON public.receivables
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_receivables_user_id ON public.receivables(user_id);
CREATE INDEX IF NOT EXISTS idx_receivables_expected_date ON public.receivables(expected_date);
CREATE INDEX IF NOT EXISTS idx_receivables_received ON public.receivables(received);
