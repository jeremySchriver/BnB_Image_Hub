
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { toast } from 'sonner';
import Button from '@/components/Button';
import { login } from '@/utils/api';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await login(email, password);
      
      // Store the token
      localStorage.setItem('auth_token', response.access_token);
      
      toast.success('Login successful');
      
      // Redirect to the upload page
      navigate('/upload');
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error instanceof Error ? error.message : 'Login failed. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setIsDemoLoading(true);
    
    // Simulate a login delay
    setTimeout(() => {
      // Store a dummy token
      localStorage.setItem('auth_token', 'demo_token_for_preview_only');
      
      toast.success('Demo login successful');
      
      // Redirect to the upload page
      navigate('/upload');
      
      setIsDemoLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-primary">Image</span>Hub
          </h1>
          <p className="text-muted-foreground mt-2">Sign in to your account</p>
        </div>
        
        <div 
          className="bg-card border border-border/50 rounded-xl p-6 shadow-subtle animate-slide-up"
          style={{ animationDelay: '100ms' }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 focus:ring-offset-background transition-all duration-200"
                placeholder="your.email@example.com"
                required
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium">
                  Password
                </label>
                <a href="#" className="text-xs text-primary hover:underline">
                  Forgot password?
                </a>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 focus:ring-offset-background transition-all duration-200"
                placeholder="••••••••"
                required
              />
            </div>
            
            <Button
              type="submit"
              size="lg"
              className="w-full mt-6"
              isLoading={isLoading}
              icon={<LogIn className="h-4 w-4" />}
            >
              Sign in
            </Button>
          </form>
          
          <div className="mt-4 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>
          
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="w-full mt-4"
            isLoading={isDemoLoading}
            onClick={handleDemoLogin}
          >
            Demo Login (Preview Mode)
          </Button>
        </div>
        
        <p className="text-center text-sm text-muted-foreground mt-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
          Don't have an account? <a href="#" className="text-primary hover:underline">Contact admin</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
