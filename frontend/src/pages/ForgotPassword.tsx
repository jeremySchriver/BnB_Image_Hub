import React, { useState } from 'react';
import { toast } from 'sonner';
import Button from '@/components/Button';
import { Link } from 'react-router-dom';
import { sendResetPasswordEmail, createAPIClient } from '@/utils/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const apiClient = createAPIClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
        await apiClient.forgotPassword(email);
        setSubmitted(true);
        toast.success('Reset instructions have been sent to your email');
    } catch (error) {
        console.error('Reset password error:', error);
        toast.error('Failed to send reset email. Please try again.');
    } finally {
        setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
        <div className="max-w-md w-full mx-auto text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-4">Check Your Email</h1>
          <p className="text-muted-foreground mb-6">
            If an account exists with {email}, you will receive a password reset link shortly.
          </p>
          <Link to="/login" className="text-primary hover:underline">
            Return to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Forgot Password</h1>
          <p className="text-muted-foreground mt-2">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </Button>

          <div className="text-center mt-4">
            <Link to="/login" className="text-primary hover:underline">
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;