// src/components/HardwareScanInput.jsx
import React, { useState, useRef, useEffect } from 'react';

function HardwareScanInput({ onScan, placeholder = "Scan or type SKU...", autoFocus = true }) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const scannedValue = inputValue.trim();
      if (scannedValue) {
        onScan(scannedValue);
        setInputValue('');
      }
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={inputValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      aria-label="SKU input"
      style={{ padding: '10px', fontSize: '16px', margin: '10px 0', width: 'calc(100% - 22px)' }}
    />
  );
}

export default HardwareScanInput;