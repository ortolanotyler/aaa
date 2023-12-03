import React, { useState, useContext, createContext } from 'react';
import { Switch } from '@mui/material';
import { AuthProvider } from './AuthContext';
import StockPrice from './StockPrice';
import Portfolio from './Portfolio';
import StockDataFetcher from './StockDataFetcher';
import Charts from './Charts';
import './App.css';

export const AuthContext = createContext();

const BannerWithLogin = () => {
    const { isAuthenticated, login } = useContext(AuthContext);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    if (isAuthenticated) {
        return null;
    }

    const handleLogin = () => {
        login(username, password);
    };

    return (
        <div className="banner">
            <h2>Welcome! Please log in or register.</h2>
            <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
            />
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
            />
            <button onClick={handleLogin}>Login</button>
        </div>
    );
};

function App() {
    const [portfolio, setPortfolio] = useState({});
    const { isAuthenticated } = useContext(AuthContext);

    return (
        <div>
            <BannerWithLogin />
            {isAuthenticated && (
                <div className='main-content'>
                    <Switch />
                    <StockDataFetcher />
                    <Charts />
                    <StockPrice />
                    <Portfolio portfolio={portfolio} setPortfolio={setPortfolio} />
                </div>
            )}
        </div>
    );
}

export default App;
