import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import styled, { keyframes } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/3.png';

/* ───── Animations ───── */

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50%      { transform: translateY(-20px) rotate(3deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50%      { opacity: 0.7; transform: scale(1.05); }
`;

const shimmer = keyframes`
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

/* ───── Layout ───── */

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #0a0e17;
  padding: 2rem;
  position: relative;
  overflow: hidden;
`;

/* Ambient glow orbs */
const Orb = styled.div`
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  z-index: 0;
`;

const OrbTeal = styled(Orb)`
  width: 400px;
  height: 400px;
  background: rgba(45, 212, 191, 0.12);
  top: -10%;
  right: -5%;
  animation: ${pulse} 8s ease-in-out infinite;
`;

const OrbBlue = styled(Orb)`
  width: 350px;
  height: 350px;
  background: rgba(30, 45, 72, 0.5);
  bottom: -8%;
  left: -8%;
  animation: ${pulse} 10s ease-in-out infinite 2s;
`;

const OrbSmall = styled(Orb)`
  width: 200px;
  height: 200px;
  background: rgba(45, 212, 191, 0.08);
  top: 50%;
  left: 60%;
  animation: ${float} 12s ease-in-out infinite 1s;
`;

/* ───── Logo & Branding ───── */

const BrandingWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 1;
  animation: ${fadeInUp} 0.8s ease-out;
`;

const LogoGlow = styled.div`
  position: relative;
  margin-bottom: 0.5rem;

  &::after {
    content: '';
    position: absolute;
    inset: 20%;
    border-radius: 50%;
    background: rgba(45, 212, 191, 0.25);
    filter: blur(30px);
    z-index: -1;
  }
`;

const Logo = styled.img`
  width: 140px;
  filter: drop-shadow(0 0 20px rgba(45, 212, 191, 0.3));
  transition: transform 0.4s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const Tagline = styled.p`
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.85rem;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin: 0 0 2rem;
  font-weight: 500;
`;

/* ───── Card ───── */

const CardOuter = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  animation: ${fadeInUp} 0.8s ease-out 0.15s both;
`;

const CardBorder = styled.div`
  padding: 1px;
  border-radius: 20px;
  background: linear-gradient(
    135deg,
    rgba(45, 212, 191, 0.4) 0%,
    rgba(45, 212, 191, 0.05) 40%,
    rgba(45, 212, 191, 0.05) 60%,
    rgba(45, 212, 191, 0.25) 100%
  );
`;

const Form = styled.form`
  background: rgba(12, 16, 28, 0.85);
  padding: 2.5rem;
  border-radius: 20px;
  backdrop-filter: blur(24px);
  width: 100%;
  box-sizing: border-box;
`;

/* ───── Typography ───── */

const Title = styled.h2`
  text-align: center;
  margin: 0 0 0.4rem;
  color: #fff;
  font-size: 1.7rem;
  font-weight: 700;
  letter-spacing: -0.3px;
`;

const Subtitle = styled.p`
  text-align: center;
  margin: 0 0 2rem;
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.9rem;
`;

/* ───── Inputs ───── */

const InputContainer = styled.div`
  position: relative;
  margin-bottom: 1rem;
  width: 100%;
  box-sizing: border-box;
`;

const InputLabel = styled.label`
  display: block;
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.8rem;
  font-weight: 500;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  margin-bottom: 0.4rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.85rem 1rem;
  padding-right: 2.5rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  font-size: 0.95rem;
  color: #fff;
  box-sizing: border-box;
  transition: all 0.25s ease;

  &::placeholder {
    color: rgba(255, 255, 255, 0.25);
  }

  &:focus {
    outline: none;
    border-color: rgba(45, 212, 191, 0.6);
    background: rgba(45, 212, 191, 0.04);
    box-shadow: 0 0 0 3px rgba(45, 212, 191, 0.1), 0 0 20px rgba(45, 212, 191, 0.05);
  }
`;

const EyeIcon = styled.button`
  position: absolute;
  right: 0.85rem;
  bottom: 0.7rem;
  background: none;
  border: none;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.35);
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  transition: color 0.25s ease;
  font-size: 0.9rem;

  &:hover {
    color: rgba(45, 212, 191, 0.8);
  }
`;

/* ───── Primary Button ───── */

const Button = styled.button`
  width: 100%;
  padding: 0.9rem;
  background: linear-gradient(135deg, #2DD4BF 0%, #26B8A6 100%);
  color: #0a0e17;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  margin-top: 1.5rem;
  transition: all 0.25s ease;
  box-shadow: 0 4px 20px rgba(45, 212, 191, 0.25);
  letter-spacing: 0.3px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255,255,255,0.15) 50%,
      transparent 100%
    );
    background-size: 200% 100%;
    animation: ${shimmer} 3s ease-in-out infinite;
    border-radius: 12px;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(45, 212, 191, 0.35);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 4px 15px rgba(45, 212, 191, 0.2);
  }
`;

/* ───── Social Buttons ───── */

const SocialButton = styled.button`
  width: 100%;
  padding: 0.8rem 1rem;
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  margin-top: 0.65rem;
  transition: all 0.25s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.18);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const SocialIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
`;

/* ───── Divider ───── */

const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 1.5rem 0 0.5rem;
  color: rgba(255, 255, 255, 0.3);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 1.5px;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.1),
      transparent
    );
  }
`;

/* ───── Messages ───── */

const ErrorMessage = styled.div`
  color: #FF4D4F;
  margin-bottom: 1rem;
  text-align: center;
  padding: 0.7rem;
  background: rgba(255, 77, 79, 0.08);
  border-radius: 10px;
  border: 1px solid rgba(255, 77, 79, 0.15);
  font-size: 0.88rem;
`;

const SuccessMessage = styled.div`
  color: #2DD4BF;
  margin-bottom: 1rem;
  text-align: center;
  padding: 0.7rem;
  background: rgba(45, 212, 191, 0.08);
  border-radius: 10px;
  border: 1px solid rgba(45, 212, 191, 0.15);
  font-size: 0.88rem;
`;

/* ───── Links ───── */

const ToggleButton = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.45);
  cursor: pointer;
  margin-top: 1.5rem;
  width: 100%;
  text-align: center;
  font-size: 0.88rem;
  transition: color 0.25s ease;

  span {
    color: #2DD4BF;
    font-weight: 600;
    transition: color 0.25s ease;
  }

  &:hover {
    color: rgba(255, 255, 255, 0.65);

    span {
      color: #5EEAD4;
    }
  }
`;

const ForgotPasswordLink = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.35);
  cursor: pointer;
  margin-top: 0.25rem;
  width: 100%;
  text-align: right;
  font-size: 0.82rem;
  transition: color 0.25s ease;
  padding: 0;

  &:hover {
    color: #2DD4BF;
  }
`;

/* ───── Footer ───── */

const Footer = styled.p`
  position: absolute;
  bottom: 1.5rem;
  color: rgba(255, 255, 255, 0.15);
  font-size: 0.72rem;
  letter-spacing: 0.5px;
  z-index: 1;
`;

/* ════════════════════════════════════════════════════ */

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
      {/* Ambient background orbs */}
      <OrbTeal />
      <OrbBlue />
      <OrbSmall />

      <BrandingWrap>
        <LogoGlow>
          <Logo src={logo} alt="TradeBetter" />
        </LogoGlow>
        <Tagline>Trade smarter. Journal better.</Tagline>
      </BrandingWrap>

      <CardOuter>
        <CardBorder>
          <Form onSubmit={handleSubmit}>
            <Title>{isLogin ? 'Welcome back' : 'Create account'}</Title>
            <Subtitle>
              {isLogin
                ? 'Sign in to continue to your journal'
                : 'Start your trading journal today'}
            </Subtitle>

            {error && <ErrorMessage>{error}</ErrorMessage>}
            {success && <SuccessMessage>{success}</SuccessMessage>}

            <InputContainer>
              <InputLabel htmlFor="email">Email</InputLabel>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </InputContainer>

            <InputContainer>
              <InputLabel htmlFor="password">Password</InputLabel>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <EyeIcon
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                )}
              </EyeIcon>
            </InputContainer>

            {isLogin && (
              <ForgotPasswordLink type="button" onClick={handleForgotPassword}>
                Forgot password?
              </ForgotPasswordLink>
            )}

            {!isLogin && (
              <InputContainer>
                <InputLabel htmlFor="confirmPassword">Confirm Password</InputLabel>
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <EyeIcon
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  )}
                </EyeIcon>
              </InputContainer>
            )}

            <Button type="submit">{isLogin ? 'Sign In' : 'Create Account'}</Button>

            <Divider>or continue with</Divider>

            <SocialButton type="button" onClick={handleGoogleSignIn} disabled={authLoading}>
              <SocialIcon aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 18 18" role="img" focusable="false">
                  <path fill="#4285F4" d="M17.64 9.204c0-.638-.057-1.252-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.792 2.716v2.258h2.9c1.695-1.562 2.688-3.862 2.688-6.615z" />
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.186l-2.9-2.258c-.806.54-1.84.86-3.056.86-2.352 0-4.343-1.588-5.05-3.724H.956v2.33A9 9 0 0 0 9 18z" />
                  <path fill="#FBBC05" d="M3.95 10.692A5.41 5.41 0 0 1 3.63 9c0-.587.102-1.157.32-1.692V4.978H.956A9 9 0 0 0 0 9c0 1.45.35 2.823.956 4.022l2.994-2.33z" />
                  <path fill="#EA4335" d="M9 3.58c1.322 0 2.507.455 3.44 1.35l2.58-2.58C13.463.89 11.426 0 9 0A9 9 0 0 0 .956 4.978l2.994 2.33C4.657 5.168 6.648 3.58 9 3.58z" />
                </svg>
              </SocialIcon>
              Continue with Google
            </SocialButton>

            <SocialButton type="button" onClick={handleAppleSignUp} disabled={authLoading}>
              <SocialIcon aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" role="img" focusable="false">
                  <path fill="#FFFFFF" d="M17.57 12.28c.02 2.25 1.98 3 2 3.01-.02.05-.31 1.09-1.04 2.16-.63.93-1.29 1.86-2.33 1.88-1.02.02-1.35-.6-2.52-.6-1.17 0-1.54.58-2.5.62-1 .04-1.77-.98-2.4-1.9-1.3-1.88-2.3-5.3-.96-7.62.67-1.14 1.87-1.87 3.17-1.89.99-.02 1.92.66 2.52.66.6 0 1.74-.82 2.94-.7.5.02 1.9.2 2.8 1.52-.07.04-1.67.98-1.65 2.86z" />
                  <path fill="#FFFFFF" d="M15.4 4.9c.52-.63.87-1.5.77-2.4-.75.03-1.66.5-2.2 1.13-.48.56-.9 1.47-.79 2.33.84.07 1.7-.43 2.22-1.06z" />
                </svg>
              </SocialIcon>
              Continue with Apple
            </SocialButton>

            <ToggleButton type="button" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? (
                <>Don't have an account? <span>Sign up</span></>
              ) : (
                <>Already have an account? <span>Sign in</span></>
              )}
            </ToggleButton>
          </Form>
        </CardBorder>
      </CardOuter>

      <Footer>&copy; 2026 TradeBetter</Footer>
    </LoginContainer>
  );
}
