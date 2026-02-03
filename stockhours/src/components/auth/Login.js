import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/1.png';

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%);
  padding: 2rem;
`;

const Logo = styled.img`
  width: 200px;
  margin-bottom: 2rem;
  filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.1));
`;

const Form = styled.form`
  background: rgba(26, 26, 26, 0.8);
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 400px;
  box-sizing: border-box;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
  }
`;

const Title = styled.h2`
  text-align: center;
  margin-bottom: 2rem;
  color: #fff;
  font-size: 1.8rem;
  font-weight: 600;
  letter-spacing: 0.5px;
`;

const InputContainer = styled.div`
  position: relative;
  margin-bottom: 1.5rem;
  width: 100%;
  box-sizing: border-box;
`;

const Input = styled.input`
  width: 100%;
  padding: 1rem;
  padding-right: 2.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-size: 1rem;
  color: #fff;
  box-sizing: border-box;
  transition: all 0.3s ease;

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.2);
  }
`;

const EyeIcon = styled.button`
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.5);
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  transition: color 0.3s ease;

  &:hover {
    color: #fff;
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 1.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 123, 255, 0.2);

  &:hover {
    background: linear-gradient(135deg, #0056b3 0%, #003d80 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 123, 255, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
`;

const SocialButton = styled.button`
  width: 100%;
  padding: 0.85rem 1rem;
  background: #ffffff;
  color: #111;
  border: 1px solid #d9d9d9;
  border-radius: 10px;
  font-size: 0.98rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 0.75rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);

  &:hover {
    background: #f7f7f7;
    border-color: #cfcfcf;
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.16);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const SocialIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 1.5rem 0 0.5rem;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 1px;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(255, 255, 255, 0.1);
  }
`;

const ErrorMessage = styled.div`
  color: #ff4444;
  margin-bottom: 1rem;
  text-align: center;
  padding: 0.75rem;
  background: rgba(255, 68, 68, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(255, 68, 68, 0.2);
`;

const ToggleButton = styled.button`
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  margin-top: 1.5rem;
  width: 100%;
  text-align: center;
  font-size: 0.9rem;
  transition: all 0.3s ease;

  &:hover {
    color: #0056b3;
    text-decoration: underline;
  }
`;

const ForgotPasswordLink = styled.button`
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  margin-top: 0.5rem;
  width: 100%;
  text-align: center;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  padding: 0;

  &:hover {
    color: #0056b3;
    text-decoration: underline;
  }
`;

const SuccessMessage = styled.div`
  color: #28a745;
  margin-bottom: 1rem;
  text-align: center;
  padding: 0.75rem;
  background: rgba(40, 167, 69, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(40, 167, 69, 0.2);
`;

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const { login, signup, resetPassword, signInWithGoogle, signUpWithApple } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (isLogin) {
        await login(email, password);
        navigate('/');
      } else {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        await signup(email, password);
        navigate('/');
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleForgotPassword() {
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    setError('');
    setSuccess('');
    try {
      await resetPassword(email);
      setSuccess('Password reset email sent. Please check your inbox.');
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email address');
      } else {
        setError(err.message);
      }
    }
  }

  async function handleGoogleSignIn() {
    setError('');
    setSuccess('');
    setAuthLoading(true);
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleAppleSignUp() {
    setError('');
    setSuccess('');
    setAuthLoading(true);
    try {
      await signUpWithApple();
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setAuthLoading(false);
    }
  }

  return (
    <LoginContainer>
      <Logo src={logo} alt="TradeLens Logo" />
      <Form onSubmit={handleSubmit}>
        <Title>{isLogin ? 'Welcome Back' : 'Create Account'}</Title>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}
        <InputContainer>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </InputContainer>
        <InputContainer>
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <EyeIcon
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "👁️" : "👁️‍🗨️"}
          </EyeIcon>
        </InputContainer>
        {isLogin && (
          <ForgotPasswordLink type="button" onClick={handleForgotPassword}>
            Forgot Password?
          </ForgotPasswordLink>
        )}
        {!isLogin && (
          <>
            <InputContainer>
              <Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <EyeIcon
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
              </EyeIcon>
            </InputContainer>
          </>
        )}
        <Button type="submit">{isLogin ? 'Login' : 'Sign Up'}</Button>
        <Divider>or</Divider>
        <SocialButton type="button" onClick={handleGoogleSignIn} disabled={authLoading}>
          <SocialIcon aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 18 18" role="img" focusable="false">
              <path
                fill="#4285F4"
                d="M17.64 9.204c0-.638-.057-1.252-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.792 2.716v2.258h2.9c1.695-1.562 2.688-3.862 2.688-6.615z"
              />
              <path
                fill="#34A853"
                d="M9 18c2.43 0 4.467-.806 5.956-2.186l-2.9-2.258c-.806.54-1.84.86-3.056.86-2.352 0-4.343-1.588-5.05-3.724H.956v2.33A9 9 0 0 0 9 18z"
              />
              <path
                fill="#FBBC05"
                d="M3.95 10.692A5.41 5.41 0 0 1 3.63 9c0-.587.102-1.157.32-1.692V4.978H.956A9 9 0 0 0 0 9c0 1.45.35 2.823.956 4.022l2.994-2.33z"
              />
              <path
                fill="#EA4335"
                d="M9 3.58c1.322 0 2.507.455 3.44 1.35l2.58-2.58C13.463.89 11.426 0 9 0A9 9 0 0 0 .956 4.978l2.994 2.33C4.657 5.168 6.648 3.58 9 3.58z"
              />
            </svg>
          </SocialIcon>
          Continue with Google
        </SocialButton>
        <SocialButton type="button" onClick={handleAppleSignUp} disabled={authLoading}>
          <SocialIcon aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" role="img" focusable="false">
              <path
                fill="#000000"
                d="M17.57 12.28c.02 2.25 1.98 3 2 3.01-.02.05-.31 1.09-1.04 2.16-.63.93-1.29 1.86-2.33 1.88-1.02.02-1.35-.6-2.52-.6-1.17 0-1.54.58-2.5.62-1 .04-1.77-.98-2.4-1.9-1.3-1.88-2.3-5.3-.96-7.62.67-1.14 1.87-1.87 3.17-1.89.99-.02 1.92.66 2.52.66.6 0 1.74-.82 2.94-.7.5.02 1.9.2 2.8 1.52-.07.04-1.67.98-1.65 2.86z"
              />
              <path
                fill="#000000"
                d="M15.4 4.9c.52-.63.87-1.5.77-2.4-.75.03-1.66.5-2.2 1.13-.48.56-.9 1.47-.79 2.33.84.07 1.7-.43 2.22-1.06z"
              />
            </svg>
          </SocialIcon>
          Continue with Apple
        </SocialButton>
        <ToggleButton type="button" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Need an account? Sign up' : 'Already have an account? Login'}
        </ToggleButton>
      </Form>
    </LoginContainer>
  );
} 