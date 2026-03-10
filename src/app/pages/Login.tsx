import { useState, useRef, FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useData } from '../context/DataContext';
import { toast } from 'sonner';
import degenixLogo from 'figma:asset/3920d3dc6b4fe2d056ead50809a7512181abe111.png';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const { login, users } = useData();

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate inputs
    if (!username.trim()) {
      toast.error('Please enter username');
      setIsLoading(false);
      return;
    }

    if (!password.trim()) {
      toast.error('Please enter password');
      setIsLoading(false);
      return;
    }

    // Debug: Log available users (only in development)
    if (import.meta.env.DEV) {
      console.log('Available users:', users.map(u => ({ username: u.username, role: u.role })));
      console.log('Attempting login with:', username);
    }

    // Attempt login
    setTimeout(() => {
      const success = login(username, password);
      
      if (success) {
        toast.success(`Welcome, ${username}!`);
        navigate('/dashboard');
      } else {
        toast.error('Invalid username or password. Please try again.');
        
        // Show default credentials hint
        if (username !== 'Degenix') {
          toast.info('Default credentials: Username: Degenix, Password: Dege1201', {
            duration: 5000,
          });
        }
      }
      
      setIsLoading(false);
    }, 300); // Small delay for better UX
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
      margin: 0
    }}>
      <style>{`
        @keyframes sparkle-fall {
          0% { 
            transform: translateY(-10px) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          80% {
            opacity: 0.6;
          }
          100% { 
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes sparkle-twinkle {
          0%, 100% { 
            opacity: 0.3;
          }
          50% { 
            opacity: 1;
          }
        }

        input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .sparkle {
          position: absolute;
          pointer-events: none;
          background: radial-gradient(circle, #2563eb 0%, #60a5fa 40%, transparent 70%);
          border-radius: 50%;
          box-shadow: 0 0 6px #2563eb, 0 0 10px #3b82f6;
        }
      `}</style>

      {/* Golden Sparkles */}
      {Array.from({ length: 180 }).map((_, i) => {
        const size = Math.random() < 0.7 
          ? Math.random() * 2 + 1 // 70% small sparkles (1-3px)
          : Math.random() * 3.5 + 3; // 30% medium sparkles (3-6.5px)
        
        return (
          <div 
            key={i}
            className="sparkle" 
            style={{
              left: `${Math.random() * 100}%`,
              top: `-${Math.random() * 20}px`,
              width: `${size}px`,
              height: `${size}px`,
              animation: `sparkle-fall ${Math.random() * 12 + 10}s linear ${Math.random() * 8}s infinite, sparkle-twinkle ${Math.random() * 2 + 1.5}s ease-in-out ${Math.random() * 2}s infinite`,
            }}
          />
        );
      })}

      {/* Glassmorphic Login Container */}
      <div style={{ 
        width: '100%',
        maxWidth: '420px',
        background: 'rgba(255, 255, 255, 0.01)',
        borderRadius: '24px',
        padding: '32px 35px 35px',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        backdropFilter: 'blur(12px) saturate(180%)',
        WebkitBackdropFilter: 'blur(12px) saturate(180%)',
        border: '1px solid rgba(37, 99, 235, 0.5)',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Inner glow effect */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '24px',
          padding: '2px',
          background: 'linear-gradient(145deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.05) 100%)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          pointerEvents: 'none'
        }} />

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <img 
            src={degenixLogo} 
            alt="Degenix Graphics Logo" 
            style={{ 
              width: '100%',
              maxWidth: '220px',
              height: 'auto',
              margin: '0 auto 20px',
              display: 'block',
              filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5))'
            }} 
          />
          <p style={{ 
            color: '#3b82f6', 
            fontSize: '13px',
            fontWeight: '700',
            letterSpacing: '0.3px'
          }}>
            Printing Management System
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ marginBottom: '16px' }}>
            <label 
              htmlFor="username" 
              style={{ 
                display: 'block',
                marginBottom: '8px',
                color: 'rgba(255, 255, 255, 0.95)',
                fontWeight: '600',
                fontSize: '13px',
                letterSpacing: '0.5px'
              }}
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  passwordInputRef.current?.focus();
                }
              }}
              required
              autoFocus
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '15px',
                border: '1px solid rgba(37, 99, 235, 0.4)',
                borderRadius: '14px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: 'white',
                outline: 'none',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(37, 99, 235, 0.7)';
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                e.target.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(37, 99, 235, 0.4)';
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
          
          <div style={{ marginBottom: '22px' }}>
            <label 
              htmlFor="password" 
              style={{ 
                display: 'block',
                marginBottom: '8px',
                color: 'rgba(255, 255, 255, 0.95)',
                fontWeight: '600',
                fontSize: '13px',
                letterSpacing: '0.5px'
              }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              ref={passwordInputRef}
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '15px',
                border: '1px solid rgba(37, 99, 235, 0.4)',
                borderRadius: '14px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: 'white',
                outline: 'none',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(37, 99, 235, 0.7)';
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                e.target.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(37, 99, 235, 0.4)';
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
          
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '11px',
              fontSize: '14px',
              fontWeight: '600',
              color: 'white',
              background: '#2563eb',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#1d4ed8';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#2563eb';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
            }}
          >
            {isLoading ? 'Loading...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}