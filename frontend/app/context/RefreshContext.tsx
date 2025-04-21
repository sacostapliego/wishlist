import React, { createContext, useContext, useState } from 'react';

type RefreshContextType = {
  refreshTimestamp: number;
  triggerRefresh: () => void;
};

const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

export const RefreshProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [refreshTimestamp, setRefreshTimestamp] = useState(Date.now());

  const triggerRefresh = () => {
    setRefreshTimestamp(Date.now());
  };

  return (
    <RefreshContext.Provider value={{ refreshTimestamp, triggerRefresh }}>
      {children}
    </RefreshContext.Provider>
  );
};

export const useRefresh = () => {
  const context = useContext(RefreshContext);
  if (context === undefined) {
    throw new Error('useRefresh must be used within a RefreshProvider');
  }
  return context;
};

export default RefreshContext;