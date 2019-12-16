import React, { useState } from 'react';
import { useGlobal } from 'reactn';
import { fade, makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import AccountCircle from '@material-ui/icons/AccountCircle';
import MenuItem from '@material-ui/core/MenuItem';
import Menu from '@material-ui/core/Menu';
import SearchIcon from '@material-ui/icons/Search';
import InputBase from '@material-ui/core/InputBase';
import { FormattedMessage } from 'react-intl';
import logo from '../logo.svg';
import { apolloClient } from '../index';

const useStyles = makeStyles(theme => ({
	root: {
		flexGrow: 1
	},
	menuButton: {
		marginLeft: -12,
		marginRight: 20
	},
	centered: {
		display: 'inline-block',
		width: '50%',
		margin: '0 auto'
	},
	search: {
		position: 'relative',
		borderRadius: theme.shape.borderRadius,
		backgroundColor: fade(theme.palette.common.white, 0.15),
		'&:hover': {
			backgroundColor: fade(theme.palette.common.white, 0.25),
		},
		marginRight: theme.spacing(2),
		marginLeft: 0,
		width: '100%',
		[theme.breakpoints.up('sm')]: {
			marginLeft: theme.spacing(3),
			width: 'auto',
		},
	},
	searchIcon: {
		width: theme.spacing(7),
		height: '100%',
		position: 'absolute',
		pointerEvents: 'none',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
	},
	inputRoot: {
		color: 'inherit',
	},
	inputInput: {
		padding: theme.spacing(1, 1, 1, 7),
		transition: theme.transitions.create('width'),
		width: '100%',
		[theme.breakpoints.up('md')]: {
			width: 200,
		},
	}
}));

export default (props) => {
	const classes = useStyles();
	const [anchorEl, setAnchorEl] = useState(null);
	const [loggedIn, setLoggedIn] = useGlobal('loggedIn');
	const [showLoginDialog, setShowLoginDialog] = useGlobal('showLoginDialog');
	const [searchQuery, setSearchQuery] = useGlobal('searchQuery');
	const open = Boolean(anchorEl);

	const handleChange = (e) => {
		setSearchQuery(e.target.value);
	};

	const handleKeyPress = (e) => {
		if (e.keyCode === 13) { // Enter/Return key
			e.preventDefault();
		}
	};

	return (
		<div className={classes.root}>
			<AppBar position="static">
				<Toolbar>
					<IconButton className={classes.menuButton}
							color="inherit" aria-label="Menu">
						<MenuIcon />
					</IconButton>
					<img src={logo} className="App-logo noselect" alt="logo" />
					<div className={classes.search}>
						<div className={classes.searchIcon}>
							<SearchIcon />
						</div>
						<InputBase
							placeholder="Search…"
							classes={{
								root: classes.inputRoot,
								input: classes.inputInput,
							}}
							inputProps={{ 'aria-label': 'search' }}
							onChange={handleChange}
						/>
					</div>
					<span className={classes.centered}>
						<Typography variant="title" color="inherit" className="vertical-center">
							<FormattedMessage id="appName" defaultMessage={" "} />
						</Typography>
					</span>
					<IconButton
						aria-owns={open ? 'menu-appbar' : undefined}
						aria-haspopup="true"
						onClick={(e) => {
							if (loggedIn) {
								setAnchorEl(e.currentTarget); // Show user menu
							} else {
								setShowLoginDialog(true);
							}
						}}
						color="inherit"
					>
						<AccountCircle />
					</IconButton>
					<Menu
						id="menu-appbar"
						anchorEl={anchorEl}
						anchorOrigin={{
							vertical: 'top',
							horizontal: 'right',
						}}
						transformOrigin={{
							vertical: 'top',
							horizontal: 'right',
						}}
						open={open}
						onClose={() => {
							setAnchorEl(null); // Close menu
						}}
					>
						<MenuItem onClick={() => {
							setAnchorEl(null); // Close menu
						}}>
							<FormattedMessage
								id="login.myAccount" defaultMessage="My account"/>
						</MenuItem>
						<MenuItem onClick={() => {
							setAnchorEl(null); // Close menu
							// LOG OUT
							localStorage.removeItem('authToken');
							apolloClient.resetStore();
							setLoggedIn(false); // GLOBAL STATE
						}}>
							<FormattedMessage
								id="login.logout" defaultMessage="Log out"/>
						</MenuItem>
					</Menu>
				</Toolbar>
			</AppBar>
		</div>
	);
};
