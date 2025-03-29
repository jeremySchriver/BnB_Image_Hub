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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await login(email, password);
      if (response.access_token) {
        localStorage.setItem('auth_token', response.access_token);
        toast.success('Login successful');
        navigate('/upload');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-primary">Image</span>Hub
          </h1>
          <p className="text-muted-foreground mt-2">Sign in to access the image management system</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4 animate-slide-up">
          <div className="space-y-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:border-primary"
              required
            />
          </div>
          
          <div className="space-y-2">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:border-primary"
              required
            />
          </div>
          
          <Button
            type="submit"
            size="lg"
            className="w-full"
            isLoading={isLoading}
            icon={<LogIn className="h-4 w-4" />}
          >
            Sign in
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
          Need an account? <a href="mailto:admin@example.com" className="text-primary hover:underline">Contact admin</a>
        </p>
      </div>
    </div>
  );
};

export default Login;