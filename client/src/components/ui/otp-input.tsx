import React, { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface OTPInputProps {
  length?: number;
  onComplete: (otp: string) => void;
  className?: string;
}

export function OTPInput({ length = 6, onComplete, className }: OTPInputProps) {
  const [otp, setOTP] = useState(new Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return;

    const newOTP = [...otp];
    newOTP[index] = element.value;
    setOTP(newOTP);

    // Focus next input
    if (element.value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Call onComplete when OTP is complete
    if (newOTP.every(digit => digit !== '')) {
      onComplete(newOTP.join(''));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain');
    const pastedOTP = pastedData.slice(0, length).split('');
    
    if (pastedOTP.every(char => !isNaN(Number(char)))) {
      const newOTP = new Array(length).fill('');
      pastedOTP.forEach((char, index) => {
        newOTP[index] = char;
      });
      setOTP(newOTP);
      
      if (newOTP.every(digit => digit !== '')) {
        onComplete(newOTP.join(''));
      }
    }
  };

  return (
    <div className={cn("flex gap-2 justify-center", className)}>
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(ref) => (inputRefs.current[index] = ref)}
          type="text"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(e.target, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          className="w-12 h-12 text-center text-xl font-semibold border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring outline-none transition-colors"
          data-testid={`otp-input-${index}`}
        />
      ))}
    </div>
  );
}
