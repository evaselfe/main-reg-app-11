-- Create category transfer requests table
CREATE TABLE public.category_transfer_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id UUID NOT NULL,
  from_category_id UUID NOT NULL,
  to_category_id UUID NOT NULL,
  mobile_number TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reason TEXT,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.category_transfer_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for category transfer requests
CREATE POLICY "Anyone can create transfer requests" 
ON public.category_transfer_requests 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view their own transfer requests" 
ON public.category_transfer_requests 
FOR SELECT 
USING (true);

CREATE POLICY "Admin can manage transfer requests" 
ON public.category_transfer_requests 
FOR ALL 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_category_transfer_requests_updated_at
BEFORE UPDATE ON public.category_transfer_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();