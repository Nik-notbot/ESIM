-- Create qr_codes table
CREATE TABLE IF NOT EXISTS qr_codes (
    id SERIAL PRIMARY KEY,
    qr_url TEXT NOT NULL,
    status BOOLEAN DEFAULT FALSE,
    email TEXT,
    phone TEXT,
    invoice_id TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_qr_codes_status ON qr_codes(status);
CREATE INDEX idx_qr_codes_email_phone ON qr_codes(email, phone);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_qr_codes_updated_at BEFORE UPDATE ON qr_codes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample QR codes (replace with your actual QR code URLs)
INSERT INTO qr_codes (qr_url) VALUES
    ('https://example.com/qr-codes/esim-001.png'),
    ('https://example.com/qr-codes/esim-002.png'),
    ('https://example.com/qr-codes/esim-003.png'),
    ('https://example.com/qr-codes/esim-004.png'),
    ('https://example.com/qr-codes/esim-005.png');

-- Grant permissions (adjust based on your needs)
-- This assumes you're using Row Level Security (RLS)
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

-- Policy for service role (backend) - full access
CREATE POLICY "Service role can manage all qr_codes" ON qr_codes
    FOR ALL USING (auth.role() = 'service_role');

-- Policy for anon role - read only for paid QR codes
CREATE POLICY "Anon users can read their paid qr_codes" ON qr_codes
    FOR SELECT USING (
        status = true 
        AND email = current_setting('request.jwt.claims', true)::json->>'email'
    );