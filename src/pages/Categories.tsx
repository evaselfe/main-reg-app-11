import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import RegistrationForm from '@/components/RegistrationForm';

interface Category {
  id: string;
  name_english: string;
  name_malayalam: string;
  description: string;
  actual_fee: number;
  offer_fee: number;
  offer_start_date?: string;
  offer_end_date?: string;
}

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);

  const getOfferTimeRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isOfferActive = (startDate?: string, endDate?: string) => {
    if (!startDate || !endDate) return true;
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    return now >= start && now <= end;
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name_english');
    
    if (data) setCategories(data);
  };

  const handleRegisterClick = (category: Category) => {
    setSelectedCategory(category);
    setShowRegistrationForm(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">സ്വയം തൊഴിൽ വിഭാഗങ്ങൾ</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            താങ്കൾക്ക് ആവശ്യമായ സ്വയംതൊഴിൽ മേഖല ഏതാണെന്ന് ഇവിടെനിന്ന് തിരഞ്ഞെടുക്കുക.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => {
            const isJobCard = category.name_english.toLowerCase().includes('job card');
            const offerActive = isOfferActive(category.offer_start_date, category.offer_end_date);
            const daysRemaining = category.offer_end_date ? getOfferTimeRemaining(category.offer_end_date) : null;
            const showOfferCountdown = isJobCard && offerActive && daysRemaining !== null && daysRemaining > 0;
            
            const colorClasses = [
              'bg-category-blue border-category-blue-foreground text-category-blue-foreground',
              'bg-category-green border-category-green-foreground text-category-green-foreground', 
              'bg-category-purple border-category-purple-foreground text-category-purple-foreground',
              'bg-category-orange border-category-orange-foreground text-category-orange-foreground',
              'bg-category-pink border-category-pink-foreground text-category-pink-foreground',
              'bg-category-indigo border-category-indigo-foreground text-category-indigo-foreground'
            ];
            const colorClass = colorClasses[index % colorClasses.length];
            
            return (
                <Card 
                key={category.id} 
                className={`border-2 ${
                  isJobCard 
                    ? 'golden-card text-black border-gold shadow-lg' 
                    : `glass-card category-hover ${colorClass}`
                }`}
              >
                <CardHeader>
                  <CardTitle className="text-lg">
                    <div className={isJobCard ? 'font-bold text-black' : ''}>{category.name_english}</div>
                    <div className={`text-base font-normal mt-1 ${isJobCard ? 'text-black/80' : 'opacity-80'}`}>
                      {category.name_malayalam}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {category.description && (
                    <p className={`mb-4 ${isJobCard ? 'text-black/90' : 'opacity-90'}`}>{category.description}</p>
                  )}
                  
                  {showOfferCountdown && (
                    <div className="mb-3 p-2 bg-red-100 rounded-lg border border-red-300">
                      <p className="text-red-700 font-semibold text-sm text-center">
                        ⏰ Offer ends in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                  
                  {(category.actual_fee > 0 || category.offer_fee > 0) && (
                    <div className="mb-4">
                      {category.actual_fee > 0 && category.offer_fee > 0 && category.offer_fee < category.actual_fee ? (
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-bold ${isJobCard ? 'text-black' : 'text-green-600'}`}>₹{category.offer_fee}</span>
                          <span className={`text-sm line-through ${isJobCard ? 'text-black/60' : 'opacity-60'}`}>₹{category.actual_fee}</span>
                        </div>
                      ) : category.actual_fee > 0 ? (
                        <span className={`text-lg font-bold ${isJobCard ? 'text-black' : ''}`}>₹{category.actual_fee}</span>
                      ) : (
                        <span className={`text-lg font-bold ${isJobCard ? 'text-black' : 'text-green-600'}`}>Free</span>
                      )}
                    </div>
                  )}

                  <Button 
                    onClick={() => handleRegisterClick(category)}
                    className={`w-full transition-all duration-300 ${
                      isJobCard 
                        ? 'bg-black/80 hover:bg-black text-yellow-300 hover:text-yellow-200 border-black/50 shadow-lg hover:shadow-xl transform hover:scale-105 font-bold' 
                        : 'hover:transform hover:scale-105'
                    }`}
                    size="lg"
                    variant={isJobCard ? 'outline' : 'default'}
                  >
                    രജിസ്റ്റർ ചെയ്യുക
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Registration Form Dialog */}
      <Dialog open={showRegistrationForm} onOpenChange={setShowRegistrationForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Registration for {selectedCategory?.name_english}
            </DialogTitle>
          </DialogHeader>
          {selectedCategory && (
            <RegistrationForm 
              category={selectedCategory}
              onSuccess={() => setShowRegistrationForm(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Categories;