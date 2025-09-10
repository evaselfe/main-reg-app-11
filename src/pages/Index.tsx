import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Users, FileCheck, Link as LinkIcon, Megaphone } from 'lucide-react';
interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
}
interface Utility {
  id: string;
  name: string;
  url: string;
  description: string;
}
const Index = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [utilities, setUtilities] = useState<Utility[]>([]);
  useEffect(() => {
    fetchAnnouncements();
    fetchUtilities();
  }, []);
  const fetchAnnouncements = async () => {
    const {
      data
    } = await supabase.from('announcements').select('*').eq('is_active', true).order('created_at', {
      ascending: false
    }).limit(3);
    if (data) setAnnouncements(data);
  };
  const fetchUtilities = async () => {
    const {
      data
    } = await supabase.from('utilities').select('*').eq('is_active', true).limit(6);
    if (data) setUtilities(data);
  };
  return <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-vibrant-purple via-vibrant-pink to-vibrant-orange text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent">
            Women Self Employment Program
          </h1>
          <p className="text-xl md:text-2xl mb-10 max-w-4xl mx-auto text-white/95 leading-relaxed">
            Empowering women through self-employment opportunities and skills development. 
            Join our comprehensive program designed to support women entrepreneurs in building 
            sustainable businesses and achieving financial independence.
          </p>
        </div>
        <div className="absolute top-10 left-10 w-20 h-20 bg-vibrant-blue/30 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-vibrant-green/30 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-yellow-400/30 rounded-full blur-lg"></div>
      </section>

      {/* Quick Action Cards */}
      <section className="py-20 bg-gradient-to-r from-vibrant-blue/10 via-vibrant-green/10 to-vibrant-purple/10">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">
            <Link to="/categories">
              <Card className="h-full transition-all duration-300 cursor-pointer border-2 bg-gradient-to-br from-vibrant-green/20 to-vibrant-blue/20 hover:from-vibrant-green/30 hover:to-vibrant-blue/30 hover:scale-105 hover:shadow-2xl hover:shadow-vibrant-green/20">
                <CardHeader className="text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-vibrant-green to-vibrant-blue rounded-full flex items-center justify-center shadow-lg">
                    <Users className="w-10 h-10 text-white" />
                  </div>
                  <CardTitle className="text-3xl bg-gradient-to-r from-vibrant-green to-vibrant-blue bg-clip-text text-transparent">Register for Categories
(രജിസ്റ്റർ ചെയ്യുക )</CardTitle>
                  <CardDescription className="text-lg text-gray-700">
                    Choose from various self-employment categories and start your registration process
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button size="lg" className="w-full bg-gradient-to-r from-vibrant-green to-vibrant-blue hover:from-vibrant-green/90 hover:to-vibrant-blue/90 text-white shadow-lg">
                    Start Registration
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Link to="/status">
              <Card className="h-full transition-all duration-300 cursor-pointer border-2 bg-gradient-to-br from-vibrant-orange/20 to-vibrant-pink/20 hover:from-vibrant-orange/30 hover:to-vibrant-pink/30 hover:scale-105 hover:shadow-2xl hover:shadow-vibrant-orange/20">
                <CardHeader className="text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-vibrant-orange to-vibrant-pink rounded-full flex items-center justify-center shadow-lg">
                    <FileCheck className="w-10 h-10 text-white" />
                  </div>
                  <CardTitle className="text-3xl bg-gradient-to-r from-vibrant-orange to-vibrant-pink bg-clip-text text-transparent">രജിസ്‌ട്രേഷൻ സ്റ്റാറ്റസ് ചെക്ക് ചെയ്യുക </CardTitle>
                  <CardDescription className="text-lg text-gray-700">താങ്കളുടെ മൊബൈൽ നമ്പർ ഉപയോഗിച്ച താങ്കളുടെ രജിസ്‌ട്രേഷൻ സ്ഥിതി ഗതി അറിയുക </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button size="lg" variant="outline" className="w-full border-2 border-vibrant-orange text-vibrant-orange hover:bg-gradient-to-r hover:from-vibrant-orange hover:to-vibrant-pink hover:text-white hover:border-transparent shadow-lg">
                    Check Status
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Job Card Special */}
      <section className="py-20 bg-gradient-to-r from-vibrant-purple/20 via-vibrant-pink/20 to-vibrant-orange/20">
        <div className="container mx-auto px-4 max-w-lg">
          <Card className="golden-card text-black shadow-2xl rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-200/50 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center relative z-10">
                Job Card (Special)
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center relative z-10">
              <p className="mb-6 text-lg font-medium">ഇത് ഒരു സ്പെഷ്യൽ ഓഫർ ആണ്. ഇ ലൈഫ് സൊസൈറ്റി മുന്നോട്ട് വയ്ക്കുന്ന എല്ലാ സാധ്യതകളിലേക്കും ഒരൊറ്റ രജിസ്‌ട്രേഷൻ വഴി അപേക്ഷിക്കുന്ന അവസരമാണ് ജോബ് കാർഡ് </p>
              <span className="font-bold text-4xl block mb-6 text-yellow-900">₹300</span>
              <Button size="lg" className="w-full bg-gradient-to-r from-yellow-900 to-yellow-800 text-yellow-100 hover:from-yellow-800 hover:to-yellow-700 shadow-xl border-2 border-yellow-700">
                Get Job Card
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Utilities Section */}
      <section className="py-20 bg-gradient-to-br from-vibrant-blue/15 via-white to-vibrant-green/15">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-vibrant-blue to-vibrant-green bg-clip-text text-transparent">Utility Links</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {utilities.map((utility, index) => {
            const colors = ['from-vibrant-blue/20 to-vibrant-purple/20 hover:from-vibrant-blue/30 hover:to-vibrant-purple/30', 'from-vibrant-green/20 to-vibrant-blue/20 hover:from-vibrant-green/30 hover:to-vibrant-blue/30', 'from-vibrant-orange/20 to-vibrant-pink/20 hover:from-vibrant-orange/30 hover:to-vibrant-pink/30', 'from-vibrant-pink/20 to-vibrant-purple/20 hover:from-vibrant-pink/30 hover:to-vibrant-purple/30', 'from-vibrant-purple/20 to-vibrant-blue/20 hover:from-vibrant-purple/30 hover:to-vibrant-blue/30', 'from-vibrant-green/20 to-vibrant-orange/20 hover:from-vibrant-green/30 hover:to-vibrant-orange/30'];
            return <Card key={utility.id} className={`transition-all duration-300 hover:scale-105 hover:shadow-xl bg-gradient-to-br ${colors[index % colors.length]} border-2 border-white/50`}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-vibrant-blue to-vibrant-purple rounded-lg flex items-center justify-center">
                        <LinkIcon className="w-5 h-5 text-white" />
                      </div>
                      <CardTitle className="text-xl text-gray-800">{utility.name}</CardTitle>
                    </div>
                    <CardDescription className="text-gray-700 mt-2">{utility.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <a href={utility.url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="w-full border-2 border-vibrant-blue text-vibrant-blue hover:bg-vibrant-blue hover:text-white transition-all duration-300">
                        Visit Link
                      </Button>
                    </a>
                  </CardContent>
                </Card>;
          })}
          </div>
        </div>
      </section>

      {/* Announcements Section */}
      <section className="py-20 bg-gradient-to-br from-vibrant-pink/10 via-vibrant-purple/10 to-vibrant-blue/10">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-vibrant-pink to-vibrant-purple bg-clip-text text-transparent">Latest Announcements</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {announcements.map((announcement, index) => {
            const colors = ['from-vibrant-pink/20 to-vibrant-purple/20 hover:from-vibrant-pink/30 hover:to-vibrant-purple/30', 'from-vibrant-orange/20 to-vibrant-pink/20 hover:from-vibrant-orange/30 hover:to-vibrant-pink/30', 'from-vibrant-purple/20 to-vibrant-blue/20 hover:from-vibrant-purple/30 hover:to-vibrant-blue/30'];
            return <Card key={announcement.id} className={`transition-all duration-300 hover:scale-105 hover:shadow-xl bg-gradient-to-br ${colors[index % colors.length]} border-2 border-white/50`}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-vibrant-pink to-vibrant-purple rounded-lg flex items-center justify-center">
                        <Megaphone className="w-5 h-5 text-white" />
                      </div>
                      <CardTitle className="text-xl text-gray-800">{announcement.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-6 leading-relaxed">{announcement.content}</p>
                    <p className="text-sm text-gray-600 font-medium">
                      {new Date(announcement.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>;
          })}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-gradient-to-r from-vibrant-purple via-vibrant-blue to-vibrant-green text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/20"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl font-bold mb-12 bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent">Contact Us</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
              <h3 className="text-xl font-semibold mb-3 text-yellow-200">Phone</h3>
              <p className="text-white/90">+91 9497589094</p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
              <h3 className="text-xl font-semibold mb-3 text-yellow-200">Email</h3>
              <p className="text-white/90">teamelifesociety@gmail.com</p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
              <h3 className="text-xl font-semibold mb-3 text-yellow-200">Address</h3>
              <p className="text-white/90">Forza mall tirur</p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
              <h3 className="text-xl font-semibold mb-3 text-yellow-200">Office Hours</h3>
              <p className="text-white/90">Mon - Fri: 9:00 AM - 5:00 PM</p>
            </div>
          </div>
        </div>
        <div className="absolute top-20 left-20 w-24 h-24 bg-yellow-400/20 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-20 w-32 h-32 bg-pink-400/20 rounded-full blur-xl"></div>
      </section>
    </div>;
};
export default Index;