import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/clocklogo.PNG';

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
  const [invitationCode, setInvitationCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { login, signup, resetPassword } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (isLogin) {
        await login(email, password);
        navigate('/dashboard');
      } else {
        if (!invitationCode) {
          setError('Invitation code is required');
          return;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        await signup(email, password, invitationCode);
        navigate('/dashboard');
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

  return (
    <LoginContainer>
      <Logo src={logo} alt="Stock Hours Logo" />
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
            <InputContainer>
              <Input
                type="text"
                placeholder="Invitation Code"
                value={invitationCode}
                onChange={(e) => setInvitationCode(e.target.value)}
                required
              />
            </InputContainer>
          </>
        )}
        <Button type="submit">{isLogin ? 'Login' : 'Sign Up'}</Button>
        <ToggleButton type="button" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Need an account? Sign up' : 'Already have an account? Login'}
        </ToggleButton>
      </Form>
    </LoginContainer>
  );
} 