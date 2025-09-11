import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface Category {
  id: string;
  name_english: string;
  name_malayalam: string;
}

interface Registration {
  id: string;
  customer_id: string;
  full_name: string;
  mobile_number: string;
  category_id: string;
  categories: {
    name_english: string;
    name_malayalam: string;
  } | null;
}

interface CategoryTransferRequestProps {
  registration: Registration;
  onTransferRequested: () => void;
}

const CategoryTransferRequest = ({ registration, onTransferRequested }: CategoryTransferRequestProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name_english, name_malayalam')
        .eq('is_active', true)
        .neq('id', registration.category_id);

      if (error) {
        toast.error('Error fetching categories');
      } else {
        setCategories(data || []);
      }
    } catch (error) {
      toast.error('Error fetching categories');
    }
  };

  const handleSubmitTransferRequest = async () => {
    if (!selectedCategoryId) {
      toast.error('Please select a category to transfer to');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('category_transfer_requests')
        .insert({
          registration_id: registration.id,
          from_category_id: registration.category_id,
          to_category_id: selectedCategoryId,
          mobile_number: registration.mobile_number,
          customer_id: registration.customer_id,
          full_name: registration.full_name,
          reason: reason || null,
          status: 'pending'
        });

      if (error) {
        toast.error('Error submitting transfer request');
      } else {
        toast.success('Transfer request submitted successfully. It will be reviewed by admin.');
        setShowForm(false);
        setSelectedCategoryId('');
        setReason('');
        onTransferRequested();
      }
    } catch (error) {
      toast.error('Error submitting transfer request');
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);

  if (!showForm) {
    return (
      <div className="mt-6">
        <Button 
          onClick={() => setShowForm(true)}
          variant="outline"
          className="w-full"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Request Category Transfer
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <Card className="border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg text-blue-800">Category Transfer Request</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Current Category</Label>
              <p className="text-lg font-semibold">
                {registration.categories?.name_english}
                <br />
                <span className="text-base text-muted-foreground">
                  {registration.categories?.name_malayalam}
                </span>
              </p>
            </div>
            <div className="flex items-center justify-center">
              <ArrowRight className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-category">Select New Category</Label>
            <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a category to transfer to" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name_english} / {category.name_malayalam}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCategory && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <Label className="text-sm font-medium text-muted-foreground">Transfer To</Label>
              <p className="text-lg font-semibold text-blue-800">
                {selectedCategory.name_english}
                <br />
                <span className="text-base text-blue-600">
                  {selectedCategory.name_malayalam}
                </span>
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Transfer (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="Please provide a reason for the category transfer request..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-20"
            />
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={handleSubmitTransferRequest}
              disabled={loading || !selectedCategoryId}
              className="flex-1"
            >
              {loading ? 'Submitting...' : 'Submit Transfer Request'}
            </Button>
            <Button 
              onClick={() => setShowForm(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>

          <div className="text-sm text-muted-foreground bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p>
              <strong>Note:</strong> Your transfer request will be reviewed by the admin team. 
              You will be notified once the request is processed. Processing may take 1-3 business days.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CategoryTransferRequest;