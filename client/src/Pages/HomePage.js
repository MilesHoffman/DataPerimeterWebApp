import logo from '../logo.svg';
import '../App.css';
import Button from '@mui/material/Button';
import {Routes, Route, Link, useNavigate} from 'react-router-dom';
import ResourcePage from "./ResourcePage";

function Homepage() {

	const navigate = useNavigate()


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

				<Button variant="contained" onClick={() => navigate('/resourcePage')}>Nav to Resource Page...</Button>

			</header>
		</div>
	);
}

export default Homepage;