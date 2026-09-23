import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SafetyChecklist } from '../../components/SafetyChecklist';
import { useSessionStore } from '../../store/sessionStore';

export const PreStartSafetyCheck: React.FC = () => {
  const { user } = useSessionStore();
  const navigate = useNavigate();

  const handleComplete = (passed: boolean) => {
    if (passed) {
      setTimeout(() => {
        navigate('/operator/live');
      }, 1000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-4">
      <SafetyChecklist
        machineCode={user?.userId === 3 ? 'Tipper TN-XX-1234' : 'CAT 320 Excavator'}
        onChecklistComplete={handleComplete}
      />
    </div>
  );
};
