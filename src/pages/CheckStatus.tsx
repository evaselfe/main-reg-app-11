import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import CategoryTransferRequest from '@/components/CategoryTransferRequest';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';
import { toast } from 'sonner';

interface Registration {
  id: string;
  customer_id: string;
  full_name: string;
  mobile_number: string;
  status: string;
  created_at: string;
  expiry_date: string;
  fee: number | null;
  category_id: string;
  categories: {
    name_english: string;
    name_malayalam: string;
    qr_code_url?: string;
  } | null;
}

const CheckStatus = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter mobile number or customer ID');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          *,
          categories!registrations_category_id_fkey (
            name_english,
            name_malayalam,
            qr_code_url
          )
        `)
        .or(`mobile_number.eq.${searchQuery},customer_id.eq.${searchQuery}`)
        .maybeSingle();

      if (error) {
        toast.error('Error searching for registration');
        setRegistration(null);
      } else if (!data) {
        toast.error('No registration found with this mobile number or customer ID');
        setRegistration(null);
      } else {
        const reg = data as unknown as Registration;
        setRegistration(reg);
      }
    } catch (error) {
      toast.error('Error searching for registration');
      setRegistration(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'rejected':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved / അംഗീകരിച്ചു';
      case 'rejected':
        return 'Rejected / നിരസിച്ചു';
      default:
        return 'Pending / കാത്തിരിക്കുന്നു';
    }
  };


  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Check Registration Status</h1>
          <p className="text-xl text-muted-foreground">
            Enter your mobile number or customer ID to check your registration status
          </p>
        </div>

        <div className="max-w-md mx-auto mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Search Registration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search">Mobile Number or Customer ID</Label>
                <Input
                  id="search"
                  placeholder="Enter mobile number or customer ID"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} disabled={loading} className="w-full">
                <Search className="w-4 h-4 mr-2" />
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {registration && (
          <div className="max-w-2xl mx-auto">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl text-center">Registration Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Customer ID</Label>
                    <p className="text-lg font-semibold">{registration.customer_id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                    <p className="text-lg font-semibold">{registration.full_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Mobile Number</Label>
                    <p className="text-lg font-semibold">{registration.mobile_number}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                    <p className="text-lg font-semibold">
                      {registration.categories?.name_english || 'N/A'}
                      <br />
                      <span className="text-base text-muted-foreground">
                        {registration.categories?.name_malayalam || 'N/A'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Registration Date</Label>
                    <p className="text-lg font-semibold">
                      {new Date(registration.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Expiry Date</Label>
                    <p className="text-lg font-semibold">
                      {new Date(registration.expiry_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="text-center">
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div className={`inline-block px-6 py-3 rounded-lg border-2 font-bold text-lg mt-2 ${getStatusColor(registration.status)}`}>
                    {getStatusText(registration.status)}
                  </div>
                </div>

                {registration.status === 'pending' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <p className="text-blue-800">
                      Your registration is currently under review. You will be notified once it's processed.
                    </p>
                  </div>
                )}

                {registration.status === 'approved' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <p className="text-green-800 font-semibold">
                      Congratulations! Your registration has been approved.
                    </p>
                  </div>
                )}

                {registration.status === 'rejected' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <p className="text-red-800">
                      Your registration has been rejected. Please contact our support team for more information.
                    </p>
                  </div>
                )}
                {registration.status === 'pending' && (registration.fee ?? 0) > 0 && (
                  <div className="mt-4 p-4 border rounded-lg bg-muted">
                    <p className="font-semibold mb-2">Complete Payment</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Scan the QR code below to pay the registration fee of ₹{registration.fee}. After payment, your application will be processed.
                    </p>
                    {registration.categories?.qr_code_url ? (
                      <div className="flex justify-center">
                        <div className="bg-white p-4 rounded-lg border shadow-sm">
                          <img
                            src={registration.categories.qr_code_url}
                            alt="Payment QR code"
                            className="w-48 h-48 object-contain"
                          />
                          <p className="text-xs text-center text-muted-foreground mt-2">
                            Payment QR Code for {registration.categories.name_english}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-center">
                        <div className="w-48 h-48 bg-gray-100 rounded-lg border border-dashed border-gray-300 flex items-center justify-center">
                          <p className="text-sm text-gray-500 text-center">
                            QR Code not available<br />
                            Please contact support
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {(registration.status === 'approved' || registration.status === 'pending') && (
                  <CategoryTransferRequest 
                    registration={registration}
                    onTransferRequested={() => {
                      toast.success('Transfer request submitted successfully');
                    }}
                  />
                )}

              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckStatus;