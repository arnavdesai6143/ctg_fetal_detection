import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import './LoginPage.css';

const ForgotPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const resetToken = searchParams.get('token');

    // Forgot password form
    const [email, setEmail] = useState('');
    const [emailSent, setEmailSent] = useState(false);

    // Reset password form
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [resetSuccess, setResetSuccess] = useState(false);

    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { forgotPassword, resetPassword } = useAuth();
    const navigate = useNavigate();

    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await forgotPassword(email);

        if (result.success) {
            setEmailSent(true);
        } else {
            setError(result.error);
        }

        setIsLoading(false);
    };

    const handleResetSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setIsLoading(true);

        const result = await resetPassword(resetToken, newPassword);

        if (result.success) {
            setResetSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } else {
            setError(result.error);
        }

        setIsLoading(false);
    };

    // Reset password form (when token is present)
    if (resetToken) {
        if (resetSuccess) {
            return (
                <div className="login-page">
                    <div className="login-container">
                        <div className="login-card">
                            <div className="login-header">
                                <div className="login-logo">
                                    <span className="logo-icon">✓</span>
                                    <span className="logo-text">Success!</span>
                                </div>
                                <p className="login-subtitle">
                                    Your password has been reset successfully. Redirecting to login...
                                </p>
                            </div>
                            <Button variant="primary" onClick={() => navigate('/login')}>
                                Go to Login
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="login-page">
                <div className="login-container">
                    <div className="login-card">
                        <div className="login-header">
                            <div className="login-logo">
                                <span className="logo-icon">🔐</span>
                                <span className="logo-text">Reset Password</span>
                            </div>
                            <p className="login-subtitle">
                                Enter your new password below
                            </p>
                        </div>

                        <form className="login-form" onSubmit={handleResetSubmit}>
                            {error && <div className="login-error">{error}</div>}

                            <Input
                                label="New Password"
                                type="password"
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />

                            <Input
                                label="Confirm Password"
                                type="password"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />

                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                loading={isLoading}
                                className="login-button"
                            >
                                Reset Password
                            </Button>
                        </form>

                        <div className="login-footer">
                            <Link to="/login" className="login-link">← Back to Login</Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Forgot password form
    if (emailSent) {
        return (
            <div className="login-page">
                <div className="login-container">
                    <div className="login-card">
                        <div className="login-header">
                            <div className="login-logo">
                                <span className="logo-icon">📧</span>
                                <span className="logo-text">Check Your Email</span>
                            </div>
                            <p className="login-subtitle">
                                If an account exists for <strong>{email}</strong>, a password reset link has been sent.
                            </p>
                        </div>

                        <div className="demo-credentials">
                            <div className="demo-title">Development Mode</div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                Check the backend console for the reset link. In production, this would be sent via email.
                            </p>
                        </div>

                        <div className="login-footer">
                            <Link to="/login" className="login-link">← Back to Login</Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-card">
                    <div className="login-header">
                        <div className="login-logo">
                            <span className="logo-icon">🔑</span>
                            <span className="logo-text">Forgot Password</span>
                        </div>
                        <p className="login-subtitle">
                            Enter your email to receive a password reset link
                        </p>
                    </div>

                    <form className="login-form" onSubmit={handleForgotSubmit}>
                        {error && <div className="login-error">{error}</div>}

                        <Input
                            label="Email Address"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            loading={isLoading}
                            className="login-button"
                        >
                            Send Reset Link
                        </Button>
                    </form>

                    <div className="login-footer">
                        <Link to="/login" className="login-link">← Back to Login</Link>
                    </div>
                </div>

                <div className="login-branding">
                    <p>CTG Insight™ - AI for Fetal Monitoring</p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
