import React from 'react';

interface SetupScreenProps {
  onConnect: (url: string, token: string) => Promise<void>;
}

export const SetupScreen: React.FC<SetupScreenProps> = () => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>Setup Screen Placeholder</h2>
    </div>
  );
};

export default SetupScreen;
