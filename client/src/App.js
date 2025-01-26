
import logo from './logo.svg';
import './App.css';
import Button from '@mui/material/Button';
import { Routes, Route, Link } from 'react-router-dom';
import ResourcePage from './Pages/ResourcePage';

function App() {
    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
                <p>
                    Edit <code>src/App.js</code> and save to reload.
                </p>
                <a
                    className="App-link"
                    href="https://reactjs.org"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Learn React
                </a>

                <Link to="/resourcePage">
                    <Button variant="contained">Nav to Resource Page</Button>
                </Link>
            </header>

            <Routes>
                <Route path="/resourcePage" element={<ResourcePage />} />
            </Routes>
        </div>
    );
}

export default App;