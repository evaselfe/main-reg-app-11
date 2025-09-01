import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { useState } from 'react';
const Navigation = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const navItems = [{
    label: 'Home',
    path: '/'
  }, {
    label: 'About Project',
    path: '/about'
  }, {
    label: 'Categories',
    path: '/categories'
  }, {
    label: 'Check Status',
    path: '/status'
  }, {
    label: 'Utilities',
    path: '/utilities'
  }, {
    label: 'Admin Panel',
    path: '/admin'
  }];
  const closeSheet = () => setIsOpen(false);
  return <nav className="bg-primary text-primary-foreground shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-xl font-bold truncate">E-Life Society Self Employment Program</Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-1">
            {navItems.map(item => <Link key={item.path} to={item.path}>
                <Button variant={location.pathname === item.path ? "secondary" : "ghost"} size="sm" className={cn("text-primary-foreground hover:text-primary-foreground", location.pathname === item.path && "bg-secondary text-secondary-foreground")}>
                  {item.label}
                </Button>
              </Link>)}
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="text-primary-foreground">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 bg-background">
                <div className="flex flex-col space-y-4 mt-8">
                  {navItems.map(item => <Link key={item.path} to={item.path} onClick={closeSheet}>
                      <Button variant={location.pathname === item.path ? "secondary" : "ghost"} className={cn("w-full justify-start", location.pathname === item.path && "bg-secondary text-secondary-foreground")}>
                        {item.label}
                      </Button>
                    </Link>)}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>;
};
export default Navigation;