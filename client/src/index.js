import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';
import {ThemeProvider} from "@mui/material";
import globalTheme from "./themes/GlobalTheme";
import {ProfileProvider} from "./logic/profileLogic";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <ThemeProvider theme={globalTheme}>
            <ProfileProvider>
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            </ProfileProvider>
        </ThemeProvider>
    </React.StrictMode>
);

reportWebVitals();