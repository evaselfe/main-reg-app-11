import { useState, useEffect } from 'react';
import { Bell, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ExpiringRegistrationsAlert from './ExpiringRegistrationsAlert';

interface ExpiringRegistration {
  id: string;
  name: string;
  phone: string;
  category: string;
  location: string;
  created_at: string;
  expiry_date: string;
}

const NotificationBell = () => {
  const [expiredRegistrations, setExpiredRegistrations] = useState<ExpiringRegistration[]>([]);
  const [expiringRegistrations, setExpiringRegistrations] = useState<ExpiringRegistration[]>([]);
  const [showExpiredAlert, setShowExpiredAlert] = useState(false);
  const [showExpiringAlert, setShowExpiringAlert] = useState(false);
  const [loading, setLoading] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const { toast } = useToast();

  const fetchExpiringRegistrations = async () => {
    try {
      setLoading(true);
      
      const { data: registrations, error } = await supabase
        .from('registrations')
        .select(`
          id,
          full_name,
          mobile_number,
          customer_id,
          address,
          created_at,
          expiry_date,
          categories!registrations_category_id_fkey(name_english)
        `)
        .eq('status', 'pending');

      if (error) {
        console.error('Error fetching expiring registrations:', error);
        return;
      }

      // Calculate days remaining for each registration
      const now = new Date();
      const processedRegs: ExpiringRegistration[] = registrations
        .map(reg => {
          return {
            id: reg.id,
            name: reg.full_name,
            phone: reg.mobile_number,
            category: reg.categories?.name_english || 'Unknown',
            location: reg.address,
            created_at: reg.created_at,
            expiry_date: reg.expiry_date
          };
        });

      // Separate expired and expiring registrations
      const expired = processedRegs
        .filter(reg => {
          const expiryDate = new Date(reg.expiry_date);
          const diffTime = expiryDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays <= 0;
        })
        .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());
      
      const expiring = processedRegs
        .filter(reg => {
          const expiryDate = new Date(reg.expiry_date);
          const diffTime = expiryDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays > 0 && diffDays <= 3;
        })
        .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());

      setExpiredRegistrations(expired);
      setExpiringRegistrations(expiring);
      
      console.log('Expired registrations:', expired.length);
      console.log('Expiring registrations:', expiring.length);
    } catch (error) {
      console.error('Error fetching expiring registrations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch expiring registrations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpiringRegistrations();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('registrations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'registrations'
        },
        () => {
          fetchExpiringRegistrations();
        }
      )
      .subscribe();

    // Refresh every hour
    const interval = setInterval(fetchExpiringRegistrations, 60 * 60 * 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

// Show alert automatically when expiring registrations are found (within 3 days)
useEffect(() => {
  if ((expiringRegistrations.length > 0 || expiredRegistrations.length > 0) && !acknowledged) {
    // Auto-show alert after 2 seconds on load
    const timer = setTimeout(() => {
      if (expiredRegistrations.length > 0) {
        setShowExpiredAlert(true);
      } else if (expiringRegistrations.length > 0) {
        setShowExpiringAlert(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }
}, [expiringRegistrations.length, expiredRegistrations.length, acknowledged]);


  return (
    <>
      <div className="flex items-center gap-2">
        {/* Bell icon for expired registrations */}
        {expiredRegistrations.length > 0 && (
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExpiredAlert(true)}
              className="relative p-2"
              disabled={loading}
            >
              <Bell className="h-5 w-5" />
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {expiredRegistrations.length}
              </Badge>
            </Button>
          </div>
        )}

        {/* Exclamation icon for registrations expiring within 3 days */}
        {expiringRegistrations.length > 0 && (
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExpiringAlert(true)}
              className="relative p-2"
              disabled={loading}
            >
              <AlertTriangle className="h-5 w-5" />
              <Badge 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-orange-500 hover:bg-orange-600 text-white"
              >
                {expiringRegistrations.length}
              </Badge>
            </Button>
          </div>
        )}
      </div>

      {/* Show expired registrations when bell is clicked */}
      <ExpiringRegistrationsAlert
        open={showExpiredAlert}
        onOpenChange={setShowExpiredAlert}
        registrations={expiredRegistrations}
        onGotIt={() => setAcknowledged(true)}
        isExpiring={false}
      />

      {/* Show expiring registrations when exclamation is clicked or auto-shown */}
      <ExpiringRegistrationsAlert
        open={showExpiringAlert}
        onOpenChange={setShowExpiringAlert}
        registrations={expiringRegistrations}
        onGotIt={() => setAcknowledged(true)}
        isExpiring={true}
      />
    </>
  );
};

export default NotificationBell;