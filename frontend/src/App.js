import React, { useState } from 'react';
import { ThemeProvider } from '@material-ui/styles';
import { makeStyles, createMuiTheme } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import MenuAppBar from './components/MenuAppBar';
import Main from './components/Main';
import './App.css';
import { lightTheme, darkTheme } from './themes';


export default (props) => {
	const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('authToken'));
	const [darkMode, setDarkMode] = useState({ darkMode: true });

	return (
		<ThemeProvider theme={darkMode ? createMuiTheme(darkTheme) : createMuiTheme(lightTheme)}>
			<CssBaseline />
			<div className="App">
				<header>
					<MenuAppBar loggedIn={loggedIn}/>
				</header>
				<main className="App-main">
					<Main loggedIn={loggedIn}/>
				</main>
			</div>
		</ThemeProvider>
	);
};

