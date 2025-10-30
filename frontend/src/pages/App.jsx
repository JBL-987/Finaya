import BusinessAnalysisApp from '../components/BusinessAnalysisApp';

const App = ({ isAuthenticated, login, logout, user, addGlobalLog }) => {
  return (
    <BusinessAnalysisApp
      isAuthenticated={isAuthenticated}
      login={login}
      logout={logout}
      user={user}
      addGlobalLog={addGlobalLog}
    />
  );
};

export default App;
