// client/app/components/dashboard/AcceptanceRate.tsx
import React from 'react';

interface AcceptanceRateProps {
  rate: number; // e.g., 72.00 for 72.00%
}

const AcceptanceRate: React.FC<AcceptanceRateProps> = ({ rate }) => {
  return (
    <div className="card acceptance-rate-card">
      <h3 className="card-title">Acceptance Rate</h3>
      <p className="acceptance-rate-value">{rate.toFixed(2)}%</p>
    </div>
  );
};

export default AcceptanceRate;