import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const categoryColors = [
  'blue', 'green', 'purple', 'orange', 'pink', 'indigo'
];

const getCategoryColor = (index: number) => {
  return categoryColors[index % categoryColors.length];
};

interface Category {
  id: string;
  name_english: string;
  name_malayalam: string;
  description: string;
  actual_fee: number;
  offer_fee: number;
  expiry_days: number;
  is_active: boolean;
  qr_code_url?: string;
  offer_start_date?: string;
  offer_end_date?: string;
}

const CategoriesTab = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name_english: '',
    name_malayalam: '',
    description: '',
    actual_fee: 0,
    offer_fee: 0,
    expiry_days: 30,
    offer_start_date: '',
    offer_end_date: ''
  });
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Error fetching categories');
      } else {
        setCategories(data || []);
      }
    } catch (error) {
      toast.error('Error fetching categories');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name_english: '',
      name_malayalam: '',
      description: '',
      actual_fee: 0,
      offer_fee: 0,
      expiry_days: 30,
      offer_start_date: '',
      offer_end_date: ''
    });
    setEditingCategory(null);
    setQrFile(null);
    setQrPreview(null);
  };

  const handleAddNew = () => {
    resetForm();
    setShowDialog(true);
  };

  const handleEdit = async (category: Category) => {
    setFormData({
      name_english: category.name_english,
      name_malayalam: category.name_malayalam,
      description: category.description || '',
      actual_fee: category.actual_fee,
      offer_fee: category.offer_fee,
      expiry_days: category.expiry_days,
      offer_start_date: category.offer_start_date || '',
      offer_end_date: category.offer_end_date || ''
    });
    setEditingCategory(category);
    setQrFile(null);
    
    // Load existing QR image if it exists
    if (category.qr_code_url) {
      setQrPreview(category.qr_code_url);
    } else {
      setQrPreview(null);
    }
    
    setShowDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name_english || !formData.name_malayalam) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const bucket = 'category-qr';

      if (editingCategory) {
        // Update category basic fields
        const { error } = await supabase
          .from('categories')
          .update({
            name_english: formData.name_english,
            name_malayalam: formData.name_malayalam,
            description: formData.description,
            actual_fee: formData.actual_fee,
            offer_fee: formData.offer_fee,
            expiry_days: formData.expiry_days,
            offer_start_date: formData.offer_start_date || null,
            offer_end_date: formData.offer_end_date || null,
          })
          .eq('id', editingCategory.id);

        if (error) {
          toast.error('Error updating category');
          return;
        }

        // Upload QR if a file is selected
        if (qrFile) {
          const path = `${editingCategory.id}/payment-qr.png`;
          const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(path, qrFile, { upsert: true });

          if (uploadError) {
            toast.error('Failed to upload QR image');
          } else {
            // Get the public URL and update the database
            const { data: urlData } = supabase.storage
              .from(bucket)
              .getPublicUrl(path);
            
            const { error: updateError } = await supabase
              .from('categories')
              .update({ qr_code_url: urlData.publicUrl })
              .eq('id', editingCategory.id);
              
            if (updateError) {
              toast.error('Failed to save QR URL to database');
            } else {
              toast.success('QR image saved for this category');
            }
          }
        }

        toast.success('Category updated successfully');
        setShowDialog(false);
        fetchCategories();
        resetForm();
      } else {
        // Create category first to get an ID
        const { data: created, error } = await supabase
          .from('categories')
          .insert({
            name_english: formData.name_english,
            name_malayalam: formData.name_malayalam,
            description: formData.description,
            actual_fee: formData.actual_fee,
            offer_fee: formData.offer_fee,
            expiry_days: formData.expiry_days,
            offer_start_date: formData.offer_start_date || null,
            offer_end_date: formData.offer_end_date || null,
          })
          .select('id')
          .single();

        if (error) {
          toast.error('Error creating category');
          return;
        }

        // If a QR file was selected during creation, upload it now
        if (qrFile && created?.id) {
          const path = `${created.id}/payment-qr.png`;
          const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(path, qrFile, { upsert: true });

          if (uploadError) {
            toast.error('Failed to upload QR image');
          } else {
            // Get the public URL and update the database
            const { data: urlData } = supabase.storage
              .from(bucket)
              .getPublicUrl(path);
            
            const { error: updateError } = await supabase
              .from('categories')
              .update({ qr_code_url: urlData.publicUrl })
              .eq('id', created.id);
              
            if (updateError) {
              toast.error('Failed to save QR URL to database');
            }
          }
        }

        toast.success('Category created successfully');
        setShowDialog(false);
        fetchCategories();
        resetForm();
      }
    } catch (error) {
      toast.error('Error saving category');
    }
  };

  const toggleCategoryStatus = async (category: Category) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ is_active: !category.is_active })
        .eq('id', category.id);

      if (error) {
        toast.error('Error updating category status');
      } else {
        toast.success('Category status updated');
        fetchCategories();
      }
    } catch (error) {
      toast.error('Error updating category status');
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error('Error deleting category');
      } else {
        toast.success('Category deleted successfully');
        fetchCategories();
      }
    } catch (error) {
      toast.error('Error deleting category');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Categories Management</CardTitle>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={handleAddNew}>
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh]">
              <DialogHeader className="pb-4 border-b">
                <DialogTitle className="text-lg font-semibold">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </DialogTitle>
              </DialogHeader>
              
              <div className="overflow-y-auto max-h-[calc(85vh-8rem)] pr-2">
                <form onSubmit={handleSubmit} className="space-y-8 py-2">
                  {/* Basic Information Section */}
                  <div className="space-y-5">
                    <div className="flex items-center gap-3 pb-3 border-b border-border/50">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">1</span>
                      </div>
                      <h4 className="text-base font-medium text-foreground">Basic Information</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-3">
                        <Label htmlFor="name_english" className="text-sm font-medium">English Name *</Label>
                        <Input
                          id="name_english"
                          value={formData.name_english}
                          onChange={(e) => setFormData({ ...formData, name_english: e.target.value })}
                          required
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="name_malayalam" className="text-sm font-medium">Malayalam Name *</Label>
                        <Input
                          id="name_malayalam"
                          value={formData.name_malayalam}
                          onChange={(e) => setFormData({ ...formData, name_malayalam: e.target.value })}
                          required
                          className="font-malayalam h-11"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="min-h-[100px] resize-none"
                        placeholder="Enter category description..."
                      />
                    </div>
                  </div>

                  {/* Pricing & Expiry Section */}
                  <div className="space-y-5">
                    <div className="flex items-center gap-3 pb-3 border-b border-border/50">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">2</span>
                      </div>
                      <h4 className="text-base font-medium text-foreground">Pricing & Expiry</h4>
                    </div>
                    
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                       <div className="space-y-3">
                         <Label htmlFor="actual_fee" className="text-sm font-medium">Actual Fee (₹)</Label>
                         <Input
                           id="actual_fee"
                           type="number"
                           min="0"
                           step="0.01"
                           value={formData.actual_fee}
                           onChange={(e) => setFormData({ ...formData, actual_fee: parseFloat(e.target.value) || 0 })}
                           className="h-11"
                         />
                       </div>

                       <div className="space-y-3">
                         <Label htmlFor="offer_fee" className="text-sm font-medium">Offer Fee (₹)</Label>
                         <Input
                           id="offer_fee"
                           type="number"
                           min="0"
                           step="0.01"
                           value={formData.offer_fee}
                           onChange={(e) => setFormData({ ...formData, offer_fee: parseFloat(e.target.value) || 0 })}
                           className="h-11"
                         />
                       </div>

                       <div className="space-y-3">
                         <Label htmlFor="expiry_days" className="text-sm font-medium">Expiry (Days)</Label>
                         <Input
                           id="expiry_days"
                           type="number"
                           min="1"
                           value={formData.expiry_days}
                           onChange={(e) => setFormData({ ...formData, expiry_days: parseInt(e.target.value) || 30 })}
                           className="h-11"
                         />
                       </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                       <div className="space-y-3">
                         <Label htmlFor="offer_start_date" className="text-sm font-medium">Offer Start Date</Label>
                         <Input
                           id="offer_start_date"
                           type="date"
                           value={formData.offer_start_date}
                           onChange={(e) => setFormData({ ...formData, offer_start_date: e.target.value })}
                           className="h-11"
                         />
                       </div>

                       <div className="space-y-3">
                         <Label htmlFor="offer_end_date" className="text-sm font-medium">Offer End Date</Label>
                         <Input
                           id="offer_end_date"
                           type="date"
                           value={formData.offer_end_date}
                           onChange={(e) => setFormData({ ...formData, offer_end_date: e.target.value })}
                           className="h-11"
                         />
                       </div>
                     </div>
                  </div>

                  {/* Payment QR Section */}
                  <div className="space-y-5">
                    <div className="flex items-center gap-3 pb-3 border-b border-border/50">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">3</span>
                      </div>
                      <h4 className="text-base font-medium text-foreground">Payment QR Code</h4>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <Label htmlFor="payment_qr" className="text-sm font-medium">Upload QR Image</Label>
                        <Input
                          id="payment_qr"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setQrFile(file);
                            if (file) {
                              setQrPreview(URL.createObjectURL(file));
                            }
                          }}
                          className="h-11"
                        />
                        <p className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-md">
                          💡 This QR code will be displayed to users during the payment process for this category.
                        </p>
                      </div>
                      
                      {qrPreview && (
                        <div className="flex justify-center py-4">
                          <div className="border-2 border-dashed border-border rounded-xl p-6 bg-muted/20">
                            <img 
                              src={qrPreview} 
                              alt="QR Code Preview" 
                              className="h-40 w-40 object-contain mx-auto rounded-lg"
                            />
                            <p className="text-xs text-center text-muted-foreground mt-3 font-medium">QR Code Preview</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </form>
              </div>

              {/* Fixed Action Buttons */}
              <div className="flex gap-3 pt-6 border-t bg-background">
                <Button 
                  type="submit" 
                  className="flex-1 h-11"
                  onClick={handleSubmit}
                >
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowDialog(false)}
                  className="h-11 px-8"
                >
                  Cancel
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category, index) => {
              const colorVariant = getCategoryColor(index);
              return (
                <Card key={category.id} className={`bg-category-${colorVariant} border-category-${colorVariant}-foreground/20`}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className={`font-semibold text-category-${colorVariant}-foreground mb-1`}>
                          {category.name_english}
                        </h3>
                        <p className={`text-sm text-category-${colorVariant}-foreground/80 font-malayalam`}>
                          {category.name_malayalam}
                        </p>
                      </div>
                      <Badge 
                        className={`${category.is_active 
                          ? 'bg-green-500/20 text-green-700 border-green-500/30' 
                          : 'bg-red-500/20 text-red-700 border-red-500/30'
                        } cursor-pointer`}
                        onClick={() => toggleCategoryStatus(category)}
                      >
                        {category.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    
                    {category.description && (
                      <p className={`text-sm text-category-${colorVariant}-foreground/70 mb-3 line-clamp-2`}>
                        {category.description}
                      </p>
                    )}
                    
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <div className={`text-sm font-medium text-category-${colorVariant}-foreground`}>
                          ₹{category.offer_fee}
                        </div>
                        {category.actual_fee !== category.offer_fee && (
                          <div className={`text-xs text-category-${colorVariant}-foreground/60 line-through`}>
                            ₹{category.actual_fee}
                          </div>
                        )}
                      </div>
                      <div className={`text-sm text-category-${colorVariant}-foreground/80`}>
                        {category.expiry_days} days
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(category)}
                        className={`flex-1 border-category-${colorVariant}-foreground/30 text-category-${colorVariant}-foreground hover:bg-category-${colorVariant}-foreground/10`}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteCategory(category.id)}
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CategoriesTab;